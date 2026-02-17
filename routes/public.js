const express = require("express");
const router = express.Router();
const db = require("../config/db");
const base = process.env.BASE_URL;

/* ===============================
   GET ALL PUBLIC MANGA
=============================== */
router.get("/manga", async (req, res) => {
  const [rows] = await db.query(`
    SELECT 
      m.id, m.title, m.slug, m.cover_image, m.description, m.views,
      GROUP_CONCAT(g.name) AS genres
    FROM manga m
    LEFT JOIN manga_genres mg ON m.id = mg.manga_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE m.status = 'approved'
    GROUP BY m.id
    ORDER BY m.created_at DESC
  `);

  res.json(rows);
});

/* ===============================
   DETAIL MANGA
=============================== */
router.get("/manga/:id", async (req, res) => {
  const mangaId = req.params.id;

  const [[manga]] = await db.query(`
    SELECT 
      m.id, m.title, m.description, m.cover_image, m.views,
      GROUP_CONCAT(g.name) AS genres
    FROM manga m
    LEFT JOIN manga_genres mg ON m.id = mg.manga_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE m.id = ? AND m.status = 'approved'
    GROUP BY m.id
  `, [mangaId]);

  if (!manga) return res.status(404).json({ error: "Manga tidak ditemukan" });

  const [chapters] = await db.query(
    "SELECT id, chapter_number, title FROM chapters WHERE manga_id = ? ORDER BY chapter_number ASC",
    [mangaId]
  );

  res.json({ ...manga, chapters });
});

/* ===============================
   GET MANGA BY GENRE
=============================== */
router.get("/genre/:name", async (req, res) => {
  const genreName = req.params.name;

  const [rows] = await db.query(`
    SELECT 
      m.id, m.title, m.slug, m.cover_image, m.description, m.views,
      GROUP_CONCAT(g.name) AS genres
    FROM manga m
    JOIN manga_genres mg ON m.id = mg.manga_id
    JOIN genres g ON mg.genre_id = g.id
    WHERE m.status = 'approved'
      AND g.name = ?
    GROUP BY m.id
    ORDER BY m.created_at DESC
  `, [genreName]);

  res.json(rows);
});


/* ===============================
   READER PAGES
=============================== */
router.get("/chapter/:id", async (req, res) => {
  const [pages] = await db.query(
    "SELECT image_url, page_order FROM pages WHERE chapter_id = ? ORDER BY page_order ASC",
    [req.params.id]
  );

  res.json(pages);
});

/* ===============================
   VIEW COUNTER
=============================== */
router.post("/manga/:id/view", async (req, res) => {
  await db.query(
    "UPDATE manga SET views = views + 1 WHERE id = ?",
    [req.params.id]
  );

  res.json({ message: "View counted" });
});

/* ===============================
   ADS
=============================== */
router.get("/ads/:position/multiple/:limit", async (req, res) => {
  const { position, limit } = req.params;

  const [rows] = await db.query(
    "SELECT * FROM ads WHERE position = ? AND is_active = 1 ORDER BY RAND() LIMIT ?",
    [position, parseInt(limit)]
  );

  res.json(rows);
});

router.post("/ads/:id/click", async (req, res) => {
  await db.query(
    "UPDATE ads SET clicks = clicks + 1 WHERE id = ?",
    [req.params.id]
  );
  res.json({ message: "Click tracked" });
});

router.post("/ads/:id/impression", async (req, res) => {
  await db.query(
    "UPDATE ads SET impressions = impressions + 1 WHERE id = ?",
    [req.params.id]
  );
  res.json({ message: "Impression tracked" });
});

module.exports = router;
