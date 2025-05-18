/**
 * upload.js
 * ---------
 * Multer configuration for handling file uploads.
 * 
 * Features:
 * - Stores files in `/public/uploads/` directory
 * - Generates unique filenames using timestamps
 * - Logs each uploaded file's name and type
 */

const multer = require("multer");
const path = require("path");

// Configure storage engine
const storage = multer.diskStorage({
  // Set the upload destination directory
  destination: function (req, file, cb) {
    cb(null, path.resolve('./public/uploads/')); // Ensures correct absolute path
  },

  // Generate a unique filename with original extension
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// Create multer upload instance
const upload = multer({
  storage: storage,

  // Optional file filter — logs file info, currently allows all
  fileFilter: function (req, file, cb) {
    // console.log("Uploaded file:", file.originalname, file.mimetype);
    cb(null, true); // Accept all files
  }
});

module.exports = upload;