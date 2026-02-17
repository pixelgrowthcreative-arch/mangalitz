const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");
const upload = require("../config/upload");
const fs = require("fs");
const path = require("path");

// /* =========================
//    UPLOAD HALAMAN
// ========================= */
// router.post("/", auth, upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "File tidak diterima server" });
//     }

//     const { chapter_id, page_order } = req.body;
//     const imageUrl = `/uploads/pages/${req.file.filename}`;

//     await db.query(
//       "INSERT INTO pages (chapter_id, image_url, page_order) VALUES (?, ?, ?)",
//       [chapter_id, imageUrl, page_order]
//     );

//     res.json({ message: "Halaman berhasil diupload", imageUrl });
//   } catch (err) {
//     console.error("UPLOAD ERROR:", err);
//     res.status(500).json({ error: "Upload gagal" });
//   }
// });

/* =========================
   REORDER PAGES
========================= */

router.post("/reorder", auth, async (req, res) => {
  
  try {
    const orders = req.body; // [{id, order}]
    console.log("REORDER REQ BODY:", req.body);

    for (const o of orders) {
      await db.query(
        "UPDATE pages SET page_order = ? WHERE id = ?",
        [o.order, o.id]
      );
    }

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
    "SELECT image_url FROM pages WHERE id = ?",
    [pageId]
  );

  if (!rows.length) {
    return res.status(404).json({ error: "Page tidak ditemukan" });
  }

  const filePath = path.join(__dirname, "..", rows[0].image_url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await db.query("DELETE FROM pages WHERE id = ?", [pageId]);

  res.json({ message: "Page berhasil dihapus" });
});


// ADMIN READER PREVIEW
router.get("/admin/chapter/:chapterId", auth, async (req, res) => {
  try {
    const [pages] = await db.query(
      "SELECT image_url, page_order FROM pages WHERE chapter_id = ? ORDER BY page_order ASC",
      [req.params.chapterId]
    );

    res.json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal load admin reader" });
  }
});

/* =========================
   GET PAGES PER CHAPTER
   (LETakkan PALING BAWAH)
========================= */
router.get("/chapter/:chapterId", async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM pages WHERE chapter_id = ? ORDER BY page_order ASC",
    [req.params.chapterId]
  );
  res.json(rows);
});

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

    const newPath = path.join(chapterDir, req.file.originalname);

    fs.renameSync(req.file.path, newPath);

    const imageUrl = `/${newPath.replace(/\\/g, "/")}`;

    await db.query(
      "INSERT INTO pages (chapter_id, image_url, page_order) VALUES (?, ?, ?)",
      [chapter_id, imageUrl, page_order]
    );

    res.json({ message: "Page uploaded", imageUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload gagal" });
  }
});



module.exports = router;
