const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");
const upload = require("../config/upload");
const fs = require("fs");
const path = require("path");


/* =========================
   REORDER PAGES
========================= */

router.post("/reorder", auth, async (req, res) => {
  
  try {
    const orders = req.body; // [{id, order}]
    console.log("REORDER REQ BODY:", req.body);

    await Promise.all(
      orders.map(o =>
      db.query(
        "UPDATE pages SET page_order = $1 WHERE id = $2",
        [o.order, o.id]
        )
      )
    );


    res.json({ message: "Urutan halaman diperbarui" });
      } catch (err) {
        console.error(err);
       res.status(500).json({ error: "Gagal reorder halaman" });
      }
    });

/* =========================
   DELETE PAGE
========================= */
router.delete("/:id", auth, async (req, res) => {
  const pageId = req.params.id;

  const [rows] = await db.query(
    "SELECT image_url FROM pages WHERE id = $1",
    [pageId]
  );

  if (!rows.length) {
    return res.status(404).json({ error: "Page tidak ditemukan" });
  }

  const filePath = path.join(__dirname, "..", rows[0].image_url);
  try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
      console.warn("File delete gagal:", filePath);
  }


  await db.query("DELETE FROM pages WHERE id = $1", [pageId]);

  res.json({ message: "Page berhasil dihapus" });
});


// ADMIN READER PREVIEW
router.get("/chapter/:chapterId", async (req, res) => {

  const result = await db.query(
    "SELECT * FROM pages WHERE chapter_id = $1 ORDER BY page_order ASC",
    [req.params.chapterId]
  );

  const CDN = window.CDN_URL || "http://62.146.233.124:3001";

  const pages = result.rows.map(p => ({
    ...p,
    image_url: CDN + p.image_url
  }));

  res.json(pages);

});

/* =========================
   GET PAGES PER CHAPTER
   (LETakkan PALING BAWAH)
========================= */
// router.get("/chapter/:chapterId", async (req, res) => {
//   const [rows] = await db.query(
//     "SELECT * FROM pages WHERE chapter_id = $1 ORDER BY page_order ASC",
//     [req.params.chapterId]
//   );
//   res.json(rows);
// });

const uploadPages = require("../config/uploadPages");

router.post("/", auth, uploadPages.single("image"), async (req, res) => {
  try {
    const { manga_id, chapter_id, page_order } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File tidak diterima" });
    }

    if (!manga_id || !chapter_id) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    const chapterDir = path.join(
      "uploads",
      `manga_${manga_id}`,
      "pages",
      `ch_${chapter_id}`
    );

    fs.mkdirSync(chapterDir, { recursive: true });

    const ext = path.extname(req.file.originalname);
    const safeName =
      Date.now() + "_" + Math.random().toString(36).slice(2, 7) + ext;

    const newPath = path.join(chapterDir, safeName);


    fs.renameSync(req.file.path, newPath);

    const imageUrl = `/${newPath.replace(/\\/g, "/")}`;

    await db.query(
    "INSERT INTO pages (chapter_id, image_url, page_order) VALUES ($1, $2, $3)",
    [chapter_id, imageUrl, page_order]
    );

    res.json({ message: "Page uploaded", imageUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload gagal" });
  }
});



module.exports = router;
