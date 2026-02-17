const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");
const fs = require("fs");
const path = require("path");
const uploadCover = require("../config/uploadCover");

/* =========================
   CREATE MANGA + COVER
========================= */
router.post("/", auth, uploadCover.single("cover"), async (req, res) => {
  try {
    const { title, slug, description, age_rating, genres } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Cover manga wajib dipilih" });
    }

    // 1. insert manga dulu
    const [result] = await db.query(
      "INSERT INTO manga (title, slug, description, age_rating, user_id, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [title, slug, description, age_rating, req.user.id]
    );

    const mangaId = result.insertId;

    if (genres && genres.length){
      const genreArray = Array.isArray(genres) ? genres : [genres];

      for (const genreId of genreArray){
        await db.query(
          "INSERT INTO manga_genres (manga_id, genre_id) VALUES (?, ?)",
          [mangaId, genreId]
        )
      }
    }

    // 2. buat folder manga
    const baseDir = path.join("uploads", `manga_${mangaId}`);
    const coverDir = path.join(baseDir, "covers");
    const pagesDir = path.join(baseDir, "pages");

    fs.mkdirSync(coverDir, { recursive: true });
    fs.mkdirSync(pagesDir, { recursive: true });

    // 3. pindahkan cover ke folder manga
    const finalCoverPath = path.join(coverDir, req.file.filename);
    fs.renameSync(req.file.path, finalCoverPath);

    // 4. simpan path cover ke DB
    await db.query(
      "UPDATE manga SET cover_image = ? WHERE id = ?",
      [`/${finalCoverPath.replace(/\\/g, "/")}`, mangaId]
    );

    res.json({ message: "Manga berhasil dibuat", mangaId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membuat manga" });
  }
});

/* =========================
   GET MANGA MILIK USER
========================= */
router.get("/my", auth, async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, title, status, created_at FROM manga WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(rows);
});

/* =========================
   GET ALL MANGA (ADMIN)
========================= */
router.get("/all", auth, async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, title FROM manga ORDER BY created_at DESC"
  );
  res.json(rows);
});

/* =========================
   APPROVE / REJECT
========================= */
router.patch("/:id/approve", auth, async (req, res) => {
  await db.query("UPDATE manga SET status = 'approved' WHERE id = ?", [
    req.params.id
  ]);
  res.json({ message: "Manga approved" });
});

router.patch("/:id/reject", auth, async (req, res) => {
  await db.query("UPDATE manga SET status = 'rejected' WHERE id = ?", [
    req.params.id
  ]);
  res.json({ message: "Manga rejected" });
});

/* =========================
   DELETE MANGA (CLEAN TOTAL)
========================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    const mangaId = req.params.id;

    // hapus dari DB (chapters & pages ikut via FK cascade)
    await db.query("DELETE FROM manga WHERE id = ?", [mangaId]);

    // hapus semua file manga
    const mangaDir = path.join("uploads", `manga_${mangaId}`);
    if (fs.existsSync(mangaDir)) {
      fs.rmSync(mangaDir, { recursive: true, force: true });
    }

    res.json({ message: "Manga berhasil dihapus total" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hapus manga" });
  }
});

router.get("/stats", auth, async (req, res) => {
  const [[manga]] = await db.query(
    "SELECT COUNT(*) AS total FROM manga"
  );

  const [[chapter]] = await db.query(
    "SELECT COUNT(*) AS total FROM chapters"
  );

  const [[page]] = await db.query(
    "SELECT COUNT(*) AS total FROM pages"
  );

  const [[ads]] = await db.query(
    "SELECT COUNT(*) AS total FROM ads"
  );

  res.json({
    manga: manga.total,
    chapter: chapter.total,
    page: page.total,
    ads: ads.total
  });
});

router.get("/", async (req, res) => {
  const status = req.query.status;

  let sql = "SELECT * FROM manga";
  let params = [];

  if (status) {
    sql += " WHERE status = ?";
    params.push(status);
  }

  const [rows] = await db.query(sql, params);
  res.json(rows);
});



module.exports = router;
