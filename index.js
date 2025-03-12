require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 8080;

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
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

// Set EJS as the view engine
app.set("view engine", "ejs");

// Shared folders tracking
const sharedFolders = new Map();

// Generate unique share link
function generateShareLink() {
  return crypto.randomBytes(16).toString('hex');
}



// Determine file type
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv'];
  
  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';
  return 'other';
}

// Create shared folder route
app.post("/create-share", async (req, res) => {
  try {
    const shareLink = generateShareLink();
    const selectedFiles = req.body.files || [];
    
    // Validate and clean filenames
    const cleanedFiles = selectedFiles.map(filename => 
      `uploads/${filename.trim()}`
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
    
    // Fetch full file details for selected files
    const resources = await cloudinary.api.resources({ 
      type: "upload", 
      public_ids: selectedFiles 
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