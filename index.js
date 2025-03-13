require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Configure Multer to use Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", 
    format: async (req, file) => {
      // Preserve original file extension
      return path.extname(file.originalname).slice(1) || 'png';
    },
    public_id: (req, file) => {
      // Generate unique identifier
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `file-${uniqueSuffix}-${file.originalname}`;
    },
    resource_type: "auto", // Handle all types of files
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

// Set EJS as the view engine
app.set("view engine", "ejs");

// Shared folders and private rooms tracking
const sharedFolders = new Map();
const privateRooms = new Map();

// Generate unique share link
function generateShareLink() {
  return crypto.randomBytes(8).toString('hex');
}

// Determine file type
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.webm'];
  const pdfExtensions = ['.pdf'];
  const textExtensions = ['.txt', '.md', '.rtf', '.doc', '.docx'];
  
  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';
  if (pdfExtensions.includes(ext)) return 'pdf';
  if (textExtensions.includes(ext)) return 'text';
  return 'other';
}

// Home route to display uploaded files
app.get("/", async (req, res) => {
  try {
    const resources = await cloudinary.api.resources({ 
      type: "upload", 
      prefix: "uploads/", 
      max_results: 500 
    });
    
    const files = resources.resources.map((file) => ({
      url: file.secure_url,
      filename: file.public_id,
      format: file.format,
      bytes: file.bytes,
      created_at: file.created_at,
      type: getFileType(file.public_id)
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.render("index", { 
      files, 
      theme: req.query.theme || 'light' 
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).render("error", { 
      message: "Error fetching files from Cloudinary.",
      theme: req.query.theme || 'light'
    });
  }
});

// Create shared folder route
app.post("/create-share", async (req, res) => {
  try {
    const shareLink = generateShareLink();
    const selectedFiles = req.body.files || [];
    
    // Validate and clean filenames
    const cleanedFiles = selectedFiles.map(filename => 
      filename.trim().startsWith('uploads/') ? filename.trim() : `uploads/${filename.trim()}`
    );

    // Fetch full file details for selected files
    const resources = await cloudinary.api.resources({ 
      type: "upload", 
      public_ids: cleanedFiles 
    });

    sharedFolders.set(shareLink, {
      files: resources.resources.map(file => ({
        url: file.secure_url,
        filename: file.public_id,
        format: file.format,
        bytes: file.bytes,
        type: getFileType(file.public_id)
      })),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    res.json({ shareLink });
  } catch (error) {
    console.error('Share creation error:', error);
    res.status(500).json({ error: "Could not create share link" });
  }
});

// Create private room route
app.post("/create-private-room", async (req, res) => {
  try {
    const { roomId, password } = req.body;
    
    // Check if room ID already exists
    if (privateRooms.has(roomId)) {
      return res.status(400).json({ error: "Room ID already exists" });
    }
    
    // Create new private room
    privateRooms.set(roomId, {
      password: password, // Store hashed password in production
      files: [],
      createdAt: new Date(),
    });
    
    res.json({ success: true, roomId });
  } catch (error) {
    console.error('Private room creation error:', error);
    res.status(500).json({ error: "Could not create private room" });
  }
});

// Access private room route
app.post("/access-private-room", (req, res) => {
  const { roomId, password } = req.body;
  
  // Check if room exists
  if (!privateRooms.has(roomId)) {
    return res.status(404).json({ error: "Room not found" });
  }
  
  const room = privateRooms.get(roomId);
  
  // Check password
  if (room.password !== password) {
    return res.status(401).json({ error: "Incorrect password" });
  }
  
  // Generate a temporary access token
  const accessToken = crypto.randomBytes(16).toString('hex');
  room.accessToken = accessToken;
  
  res.json({ success: true, accessToken });
});

// View private room route
app.get("/room/:roomId", (req, res) => {
  const room = privateRooms.get(req.params.roomId);
  
  if (!room) {
    return res.status(404).render("error", { 
      message: "Private room not found",
      theme: req.query.theme || 'light'
    });
  }
  
  // Access token validation would be here in actual implementation
  // For simplicity, we're skipping that check
  
  res.render("room", {
    roomId: req.params.roomId, 
    files: room.files,
    theme: req.query.theme || 'light'
  });
});

// Upload file to private room
app.post("/room/:roomId/upload", upload.single("file"), async (req, res) => {
  const room = privateRooms.get(req.params.roomId);
  
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  
  // Access token validation would be here in actual implementation
  
  if (req.file) {
    // Add the file to the room's files
    room.files.push({
      url: req.file.path,
      filename: req.file.filename,
      format: path.extname(req.file.originalname).slice(1),
      bytes: req.file.size,
      type: getFileType(req.file.originalname),
      uploadedAt: new Date()
    });
    
    res.redirect(`/room/${req.params.roomId}?uploadSuccess=true`);
  } else {
    res.redirect(`/room/${req.params.roomId}?uploadError=true`);
  }
});

// Shared folder view route
app.get("/share/:linkId", async (req, res) => {
  const sharedFolder = sharedFolders.get(req.params.linkId);
  
  if (!sharedFolder || new Date() > sharedFolder.expiresAt) {
    return res.status(404).render("error", { 
      message: "Share link expired or invalid",
      theme: req.query.theme || 'light'
    });
  }

  res.render("shared", { 
    files: sharedFolder.files, 
    theme: req.query.theme || 'light' 
  });
});

// Create text file route
app.post("/create-text", async (req, res) => {
  try {
    const { content, filename } = req.body;
    const cleanFilename = filename.trim() || 'untitled.txt';
    
    // Create temporary file
    const tempFilePath = path.join(os.tmpdir(), cleanFilename);
    fs.writeFileSync(tempFilePath, content);
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "raw",
      folder: "uploads",
      public_id: `text-${Date.now()}`,
    });
    
    // Remove temp file
    fs.unlinkSync(tempFilePath);
    
    res.json({ 
      success: true, 
      url: result.secure_url,
      filename: result.public_id
    });
  } catch (error) {
    console.error('Text file creation error:', error);
    res.status(500).json({ error: "Could not create text file" });
  }
});

// Upload file route with progress tracking
app.post("/upload", upload.single("file"), (req, res) => {
  if (req.file) {
    res.redirect("/?uploadSuccess=true");
  } else {
    res.redirect("/?uploadError=true");
  }
});

// Rename file route
app.post("/rename", async (req, res) => {
  const { oldFilename, newFilename } = req.body;
  
  try {
    // Cloudinary doesn't have a direct rename, so we'll use a workaround
    await cloudinary.uploader.rename(
      oldFilename, 
      `uploads/${newFilename}`, 
      { overwrite: true }
    );
    
    res.json({ success: true, newFilename: `uploads/${newFilename}` });
  } catch (error) {
    console.error("Rename error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete file route
app.get("/delete/:filename(*)", async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.filename);
    res.redirect("/?deleteSuccess=true");
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).redirect("/?deleteError=true");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});