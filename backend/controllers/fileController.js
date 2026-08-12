const mongoose = require('mongoose');

let gfsBucket;

// Initialize GridFS Bucket stream handler
mongoose.connection.once('open', () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

const fileController = {
  // Upload a single file (returns file_id for schema references)
  uploadFile: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded or file invalid' });
      }
      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          id: req.file.id,
          filename: req.file.filename,
          originalname: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Stream/Download file from GridFS by file ObjectId
  getFileById: async (req, res) => {
    try {
      const { id } = req.params;
      const fileId = new mongoose.Types.ObjectId(id);

      if (!gfsBucket) {
        gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: 'uploads'
        });
      }

      const files = await gfsBucket.find({ _id: fileId }).toArray();
      if (!files || files.length === 0) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      const file = files[0];
      const contentType = file.contentType || file.metadata?.contentType || 'application/pdf';

      res.set('Content-Type', contentType);
      res.set('Content-Disposition', `inline; filename="${file.filename}"`);

      // Stream chunks from GridFS directly to HTTP response
      const readstream = gfsBucket.openDownloadStream(fileId);
      readstream.pipe(res);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete file chunks and metadata from GridFS
  deleteFileById: async (req, res) => {
    try {
      const { id } = req.params;
      const fileId = new mongoose.Types.ObjectId(id);

      if (!gfsBucket) {
        gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: 'uploads'
        });
      }

      await gfsBucket.delete(fileId);
      res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = fileController;
