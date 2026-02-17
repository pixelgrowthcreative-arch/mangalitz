const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = "uploads/pages";

// bikin folder kalau belum ada
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { manga_id, chapter_id } = req.body;

    const dir = `uploads/manga_${manga_id}/pages/ch_${chapter_id}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // biar rapi: 001.jpg, 002.jpg
    cb(null, file.originalname);
  }
});

module.exports = multer({ storage });
