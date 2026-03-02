const express = require("express");
const router = express.Router();

// Trigger scraper
router.get("/run-scraper", async (req, res) => {
  if (req.query.key !== process.env.ADMIN_KEY) {
    return res.status(403).send("Forbidden");
  }

  require("../jobs/scraper");
  res.send("Scraper started 🚀");
});

module.exports = router;