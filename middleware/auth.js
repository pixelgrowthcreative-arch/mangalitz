const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token tidak ada" });
  }

  const token = authHeader.split(" ")[1];
  

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    res.status(401).json({ error: "Token tidak valid" });
  }
};
