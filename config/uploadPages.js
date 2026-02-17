const multer = require("multer");
const path = require("path");
const fs = require("fs")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/temp"); // folder sementara
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

module.exports = multer({ storage });
