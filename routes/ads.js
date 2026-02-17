const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

// GET semua iklan
router.get("/", auth, async (req, res) => {
  const [rows] = await db.query("SELECT * FROM ads ORDER BY created_at DESC");
  res.json(rows);
});

// POST tambah iklan
router.post("/", auth, async (req, res) => {
  const { title, image_url, target_url, position } = req.body;

  await db.query(
    "INSERT INTO ads (title, image_url, target_url, position) VALUES (?, ?, ?, ?)",
    [title, image_url, target_url, position]
  );

  res.json({ message: "Iklan ditambahkan" });
});

// PATCH aktif/nonaktif
router.patch("/:id/toggle", auth, async (req, res) => {
  await db.query(
    "UPDATE ads SET is_active = NOT is_active WHERE id = ?",
    [req.params.id]
  );

  res.json({ message: "Status iklan diubah" });
});

module.exports = router;

// DELETE iklan
router.delete("/:id", auth, async (req, res) => {
  await db.query("DELETE FROM ads WHERE id = ?", [req.params.id]);
  res.json({ message: "Iklan dihapus" });
});

