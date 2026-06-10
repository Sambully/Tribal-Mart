const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, agencyOnly, adminOnly } = require('../middleware/authMiddleware');
const documentController = require('../controllers/documentController');

// Absolute path so uploads always land in backend/uploads/documents
// regardless of the cwd the server was started from.
const documentsDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Configure multer for file uploads (legacy multipart path —
// new uploads go through Cloudinary from the browser; this route
// still handles incoming multipart for any older clients).
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, documentsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Wrap upload.fields() so Multer errors (file too big, type rejected,
// disk write failed) surface as proper JSON instead of being swallowed.
const safeUpload = (req, res, next) => {
  const handler = upload.fields([
    { name: 'businessLicense', maxCount: 1 },
    { name: 'taxCertificate', maxCount: 1 },
    { name: 'authorizationLetter', maxCount: 1 }
  ]);
  handler(req, res, (err) => {
    if (err) {
      console.error('Document upload error:', err.code, err.message);
      return res.status(400).json({
        message: 'Upload failed: ' + (err.message || 'unknown error'),
        code: err.code
      });
    }
    next();
  });
};

// Agency routes
router.get('/my-documents', protect, agencyOnly, documentController.getMyDocuments);
router.post('/upload', protect, agencyOnly, safeUpload, documentController.uploadDocuments);
router.get('/check-verification', protect, agencyOnly, documentController.checkVerification);

// Admin routes
router.get('/pending', protect, adminOnly, documentController.getPendingDocuments);
router.get('/all', protect, adminOnly, documentController.getAllDocuments);
router.post('/update-status', protect, adminOnly, documentController.updateDocumentStatus);

module.exports = router;
