const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const db = require("../config/db");

let scraperProcess = null;
let logs = [];

/* ================================
   HELPER LOG
================================ */
function addLog(msg) {
  const time = new Date().toISOString();
  logs.push(`[${time}] ${msg}`);
  if (logs.length > 500) logs.shift();
}

/* ================================
   START SCRAPER
================================ */
router.post("/scrape/start", (req, res) => {
  if (scraperProcess) {
    return res.json({ message: "Scraper already running" });
  }

  scraperProcess = spawn("node", [
    path.join(__dirname, "../scraper.js")
  ]);

  scraperProcess.stdout.on("data", data => {
    addLog(data.toString());
  });

  scraperProcess.stderr.on("data", data => {
    addLog("ERROR: " + data.toString());
  });

  scraperProcess.on("close", code => {
    addLog("Scraper stopped with code: " + code);
    scraperProcess = null;
  });

  addLog("Scraper started");
  res.json({ message: "Started" });
});

/* ================================
   STOP SCRAPER
================================ */
router.post("/scrape/stop", (req, res) => {
  if (scraperProcess) {
    scraperProcess.kill();
    scraperProcess = null;
    addLog("Scraper manually stopped");
  }
  res.json({ message: "Stopped" });
});

/* ================================
   GET LOGS
================================ */
router.get("/logs", (req, res) => {
  res.json(logs);
});

/* ================================
   GET LATEST MANGA
================================ */
router.get("/manga", async (req, res) => {
  const result = await db.query(
    "SELECT id, title, created_at FROM manga ORDER BY created_at DESC LIMIT 20"
  );
  res.json(result.rows);
});

module.exports = router;