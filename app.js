const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const publicRoutes = require("./routes/public");
app.use("/api/public", publicRoutes);

app.use((req, res, next) => {
  if (
    !req.path.startsWith("/api") &&
    !req.path.startsWith("/uploads") &&
    !req.path.includes(".")
  ) {
    const filePath = path.join(__dirname, "public", req.path + ".html");
    return res.sendFile(filePath, err => {
      if (err) next();
    });
  }
  next();
});

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));


const mangaRoutes = require("./routes/manga");
app.use("/api/manga", mangaRoutes);

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const pageRoutes = require("./routes/pages");
app.use("/api/pages", pageRoutes);

// supaya gambar bisa diakses browser
app.use("/uploads", express.static("uploads"));

const adsRoutes = require("./routes/ads");
app.use("/api/ads", adsRoutes);

const genreRoutes = require("./routes/genres");
app.use("/api/genres", genreRoutes);

const chapterRoutes = require("./routes/chapters");
app.use("/api/chapters", chapterRoutes); 

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

app.get("/health", (req, res) => {
  res.send("OK");
});

