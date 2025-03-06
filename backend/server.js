const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const admin = require('firebase-admin');
// const serviceAccount = require('./serviceAccountKey.json');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin
admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'file-share',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'mp3', 'mp4', 'mov', 'zip', 'txt']
  }
});

// Configure multer
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('File Sharing API is running');
});

// Create a new room
app.post('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const { name, isEditable, filesEditable, isPermanent } = req.body;
    const roomId = uuidv4();
    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    const expiresAt = isPermanent ? null : admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);

    const roomData = {
      id: roomId,
      name,
      isEditable,
      filesEditable,
      isPermanent,
      createdBy: req.user.uid,
      createdAt,
      expiresAt,
      files: []
    };

    await admin.firestore().collection('rooms').doc(roomId).set(roomData);

    res.status(201).json({ roomId, ...roomData });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room details
app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const roomDoc = await admin.firestore().collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomData = roomDoc.data();

    // Check if temporary room has expired
    if (!roomData.isPermanent && roomData.expiresAt.toDate() < new Date()) {
      return res.status(410).json({ error: 'Room has expired' });
    }

    res.status(200).json(roomData);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Upload file to room
app.post('/api/rooms/:roomId/files', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const roomDoc = await admin.firestore().collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomData = roomDoc.data();

    // Check if user has permission to upload
    if (roomData.createdBy !== req.user.uid && !roomData.filesEditable) {
      return res.status(403).json({ error: 'You do not have permission to upload files to this room' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileData = {
      id: uuidv4(),
      name: req.file.originalname,
      url: req.file.path,
      public_id: req.file.filename,
      fileType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      uploadedBy: req.user.uid
    };

    await admin.firestore().collection('rooms').doc(roomId).update({
      files: admin.firestore.FieldValue.arrayUnion(fileData)
    });

    res.status(200).json(fileData);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Delete file from room
app.delete('/api/rooms/:roomId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { roomId, fileId } = req.params;
    const roomDoc = await admin.firestore().collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomData = roomDoc.data();

    // Check if user has permission to delete
    if (roomData.createdBy !== req.user.uid && !roomData.filesEditable) {
      return res.status(403).json({ error: 'You do not have permission to delete files from this room' });
    }

    const fileToDelete = roomData.files.find(file => file.id === fileId);

    if (!fileToDelete) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from Cloudinary
    await cloudinary.uploader.destroy(fileToDelete.public_id);

    // Remove file from room document
    await admin.firestore().collection('rooms').doc(roomId).update({
      files: admin.firestore.FieldValue.arrayRemove(fileToDelete)
    });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get user's rooms
app.get('/api/users/rooms', authenticateToken, async (req, res) => {
  try {
    const roomsSnapshot = await admin.firestore().collection('rooms')
      .where('createdBy', '==', req.user.uid)
      .get();

    const rooms = [];
    roomsSnapshot.forEach(doc => {
      const roomData = doc.data();
      if (roomData.isPermanent || (roomData.expiresAt && roomData.expiresAt.toDate() > new Date())) {
        rooms.push(roomData);
      }
    });

    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    res.status(500).json({ error: 'Failed to fetch user rooms' });
  }
});

// Create a text file
app.post('/api/rooms/:roomId/text-files', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { fileName, content } = req.body;

    const roomDoc = await admin.firestore().collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomData = roomDoc.data();

    // Check if user has permission to upload
    if (roomData.createdBy !== req.user.uid && !roomData.filesEditable) {
      return res.status(403).json({ error: 'You do not have permission to create files in this room' });
    }

    // Upload content to Cloudinary as a text file
    const uploadResult = await cloudinary.uploader.upload("data:text/plain;base64," + Buffer.from(content).toString('base64'), {
      resource_type: "raw",
      public_id: `file-share/${roomId}/${fileName}`,
      format: "txt"
    });

    const fileData = {
      id: uuidv4(),
      name: fileName,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      fileType: 'text/plain',
      size: content.length,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      uploadedBy: req.user.uid
    };

    await admin.firestore().collection('rooms').doc(roomId).update({
      files: admin.firestore.FieldValue.arrayUnion(fileData)
    });

    res.status(200).json(fileData);
  } catch (error) {
    console.error('Error creating text file:', error);
    res.status(500).json({ error: 'Failed to create text file' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
