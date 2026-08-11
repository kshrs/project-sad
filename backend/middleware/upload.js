const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sad_db';

// Configure GridFS storage engine for Multer
const storage = new GridFsStorage({
  url: MONGO_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: 'uploads' // Maps to uploads.files and uploads.chunks
      };
      resolve(fileInfo);
    });
  }
});

// Set 5MB size limit & allowed file types (PDF, PNG, JPG, JPEG)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Max File Size
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|png|jpg|jpeg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF documents and image files (png, jpg, jpeg) under 5MB are allowed!'));
    }
  }
});

module.exports = upload;
