const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");
const fs = require("fs");
const path = require("path");

/**
 * =========================
 * ADMIN – GET SEMUA CHAPTER
 * =========================
 */
router.get("/", auth, async (req, res) => {
  const [rows] = await db.query(`
    SELECT 
      c.id,
      c.chapter_number,
      c.title,
      c.manga_id,
      m.title AS manga_title
    FROM chapters c
    JOIN manga m ON c.manga_id = m.id
    ORDER BY m.title, c.chapter_number
  `);

  res.json(rows);
});

/**
 * =========================
 * ADMIN – TAMBAH CHAPTER
 * =========================
 */
router.post("/", auth, async (req, res) => {
  const { manga_id, chapter_number, title } = req.body;

  if (!manga_id || !chapter_number) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  const [manga] = await db.query(
    "SELECT id FROM manga WHERE id = ?",
    [manga_id]
  );

  if (!manga.length) {
    return res.status(400).json({ error: "Manga tidak ditemukan" });
  }

  await db.query(
    "INSERT INTO chapters (manga_id, chapter_number, title, sort_order) VALUES (?, ?, ?, ?)",
    [manga_id, chapter_number, title || null, chapter_number]
  );

  res.json({ message: "Chapter berhasil dibuat" });
});

/**
 * =========================
 * PUBLIC – GET CHAPTER BY MANGA
 * =========================
 */
router.get("/manga/:mangaId", async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, chapter_number, title FROM chapters WHERE manga_id = ? ORDER BY sort_order ASC",
    [req.params.mangaId]
  );
  res.json(rows);
});

/**
 * =========================
 * DELETE CHAPTER + FILE
 * =========================
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const chapterId = req.params.id;

    const [pages] = await db.query(
      "SELECT image_url FROM pages WHERE chapter_id = ?",
      [chapterId]
    );

    pages.forEach(p => {
      const filePath = path.join(__dirname, "..", p.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await db.query("DELETE FROM chapters WHERE id = ?", [chapterId]);

    res.json({ message: "Chapter & halaman berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hapus chapter" });
  }
});

/**
 * =========================
 * REORDER CHAPTER
 * =========================
 */
router.post("/reorder", auth, async (req, res) => {
  const orders = req.body;

  for (const o of orders) {
    await db.query(
      "UPDATE chapters SET sort_order = ? WHERE id = ?",
      [o.order, o.id]
    );
  }

  res.json({ message: "Urutan chapter diperbarui" });
});

module.exports = router;
