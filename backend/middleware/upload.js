const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');

// Memory storage keeps file chunks in RAM temporarily before streaming into GridFSBucket
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /pdf|png|jpg|jpeg/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedExtensions.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF documents and images (PNG, JPG, JPEG) under 5MB are allowed!'));
    }
  }
});

// Middleware function to handle direct GridFSBucket upload stream
const uploadToGridFS = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return next(err);
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not initialized' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    const filename = `${Date.now()}-${req.file.originalname}`;

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: { contentType: req.file.mimetype }
    });

    uploadStream.on('error', (error) => {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, error: error.message });
      }
    });

    uploadStream.on('finish', () => {
      req.file.id = uploadStream.id;
      req.file.filename = filename;
      next();
    });

    uploadStream.end(req.file.buffer);
  });
};

module.exports = {
  uploadToGridFS
};
