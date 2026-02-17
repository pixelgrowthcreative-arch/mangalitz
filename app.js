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
