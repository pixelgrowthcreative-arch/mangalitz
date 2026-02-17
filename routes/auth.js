const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
  if (rows.length === 0) return res.status(401).json({ error: "User tidak ditemukan" });

  const user = rows[0];

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Password salah" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    "SECRETKEY123",   // nanti pindah ke .env
    { expiresIn: "7d" }
  );

  res.json({ message: "Login sukses", token });
});

module.exports = router;
