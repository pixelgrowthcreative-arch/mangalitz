require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression")

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

/* ================= STATIC (WAJIB DI ATAS) ================= */

// public root (css, js, html)
app.use(express.static(path.join(__dirname, "public")));

// manga images (hasil scraper)
app.use("/manga", express.static("/data/manga"), {
  maxAge: "30d",
  etag: true
});

const adminRoutes = require("./routes/admin");
//app.use("/api/admin", adminRoutes);

// uploads manual
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= API ROUTES ================= */
app.use("/api/public", require("./routes/public"));
app.use("/api/manga", require("./routes/manga"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/pages", require("./routes/pages"));
app.use("/api/ads", require("./routes/ads"));
app.use("/api/genres", require("./routes/genres"));
app.use("/api/chapters", require("./routes/chapters"));

/* ================= HTML FALLBACK ================= */
// biar bisa buka /manga.html tanpa .html
app.get("/:page", (req, res, next) => {
  if (req.path.includes(".")) return next();

  const filePath = path.join(__dirname, "public", req.params.page + ".html");
  res.sendFile(filePath, err => {
    if (err) next();
  });
});

/* ================= HEALTH CHECK ================= */
app.get("/health", (_, res) => res.send("OK"));

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(" Server running on port", PORT);
});