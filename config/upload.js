const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { manga_id, chapter_id } = req.body;

    const dir = `uploads/manga_${manga_id}/pages/ch_${chapter_id}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safe = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    cb(null, safe + ext);
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  }
});
