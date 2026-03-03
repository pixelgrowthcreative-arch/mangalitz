require("dotenv").config();

const { execSync } = require("child_process");

const MAX_LIMIT = 9 * 1024 * 1024 * 1024; // 9GB
const STORAGE_PATH = "/data/manga";

function checkDiskLimit() {
  try {
    if (!fs.existsSync("/data")) return;

    const output = execSync("du -sb /data").toString();
    const size = parseInt(output.split("\t")[0], 10);

    const usedGB = size / (1024 * 1024 * 1024);
    console.log("Disk usage:", usedGB.toFixed(2), "GB");

    if (usedGB >= 9) {
      console.log("⚠️ STORAGE LIMIT 9GB REACHED. STOPPING SCRAPER SAFELY.");
      process.exit(0);
    }

  } catch (err) {
    console.log("Disk check error:", err.message);
  }
}

process.on("unhandledRejection", err => {
  console.error("UNHANDLED:", err);
});

process.on("uncaughtException", err => {
  console.error("CRASH:", err);
});

const axios = require("axios");
const cheerio = require("cheerio");
const slugify = require("slugify");
const db = require("../config/db");
const puppeteer = require("puppeteer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://doujin69.com";

const client = axios.create({
  timeout: 25000,
  headers: {
    "User-Agent": "Mozilla/5.0 Chrome/120",
    Referer: BASE_URL
  }
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

const mangaDir =  "/data/manga";
if (!fs.existsSync(mangaDir)) {
  fs.mkdirSync(mangaDir, { recursive: true });
}

async function downloadImage(url, filePath) {
  try {
    const res = await client.get(url, { responseType: "arraybuffer" });

    const fullPath = path.join(mangaDir, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const webpPath = fullPath.replace(".jpg", ".webp");

    checkDiskLimit(); // 🔥 cek sebelum save

    try {
      await sharp(res.data)
        .webp({ quality: 80 })
        .toFile(webpPath);

      return `/manga/${filePath.replace(".jpg", ".webp")}`;
    } catch {
      fs.writeFileSync(fullPath, res.data);
      return `/manga/${filePath}`;
    }
  } catch (err) {
    console.log("Image fail:", url);
    return url;
  }
}

async function fetch(url, retry = 2) {
  try {
    const { data } = await client.get(url);
    return data;
  } catch {
    if (retry > 0) {
      console.log("Retry:", url);
      await sleep(2000);
      return fetch(url, retry - 1);
    }
    throw new Error("Fetch failed: " + url);
  }
}

async function scrapeList(page = 1) {
  const url = page === 1
    ? BASE_URL
    : `${BASE_URL}/page/${page}`;

  const html = await fetch(url);
  const $ = cheerio.load(html);

  // debug html page 1
  if (page === 1) {
    require("fs").writeFileSync("debug.html", html);
  }

  const items = [];

  $(".listupd .bs .bsx").each((_, el) => {
    const a = $(el).find("a").first();
    const link = a.attr("href");
    const title = $(el).find(".tt").text().trim();

    if (!link || !link.includes("/doujin")) return;
    if (!title) return;

    items.push({ title, link });
  });

  const unique = [...new Map(items.map(i => [i.link, i])).values()];

  console.log(`Page ${page}: ${unique.length} grid items`);
  return unique;
}

async function scrapeDetail(link) {
  const html = await fetch(link);
  const $ = cheerio.load(html);

  let cover =
    $(".post-thumbnail img").attr("src") ||
    $("img.wp-post-image").attr("src");

  if (cover && cover.startsWith("/")) cover = BASE_URL + cover;

  const genres = [];
  $(".tags a, .post-tags a").each((_, el) => {
    genres.push($(el).text().trim());
  });

  return {
    title: $("h1").first().text().trim(),
    cover,
    description:
      $(".entry-content p").first().text().trim() || "No description",
    genres
  };
}

async function scrapeChapters(link) {
  try {
    const html = await fetch(link);
    const $ = cheerio.load(html);
    const chapters = [];

    $("a").each((_, el) => {
      const title = $(el).text().trim();
      const url = $(el).attr("href");
      if (!url) return;

      if (!url.startsWith(BASE_URL)) return;
      if (url.includes("/doujin/")) return;
      if (!/ตอน|chapter/i.test(title + url)) return;

      const match = title.match(/(\d+(\.\d+)?)/);
      const num = match ? parseFloat(match[1]) : chapters.length + 1;

      chapters.push({ title, number: num, url });
    });

    return [...new Map(chapters.map(c => [c.url, c])).values()].reverse();
  } catch {
    return [];
  }
}

async function scrapePages(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]   
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 Chrome/120");

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await autoScroll(page);

    const images = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll("img").forEach(img => {
        let src =
          img.dataset.src ||
          img.dataset.lazySrc ||
          img.dataset.original ||
          img.src;

        if (!src) return;
        if (src.match(/logo|icon|banner|ads|\.gif/i)) return;
        if (!src.match(/\.(jpg|jpeg|png|webp)/i)) return;

        results.push(src);
      });
      return [...new Set(results)];
    });

    return images.map((url, i) => ({ url, order: i + 1 }));
  } catch {
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let total = 0;
      const timer = setInterval(() => {
        window.scrollBy(0, 400);
        total += 400;
        if (total >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

async function mangaExists(slug) {
  const q = await db.query(
    "SELECT id FROM manga WHERE slug=$1",
    [slug]
  );

  console.log("CHECK SLUG:", slug, "FOUND:", q.rowCount);

  return q.rowCount > 0;
}

async function saveFullManga(manga, link) {
  const slug = slugify(manga.title, { lower: true, strict: true });
  checkStorageLimit();

  if (await mangaExists(slug)) {
    console.log("Skip existing:", manga.title);
    return;
  }

  const coverPath = `${slug}/cover.jpg`;
  const localCover = await downloadImage(manga.cover, coverPath);

  // ✅ AUTO APPROVED
  const result = await db.query(
    `INSERT INTO manga (title, slug, description, cover_image, status)
     VALUES ($1,$2,$3,$4,'approved')
     RETURNING id`,
    [manga.title, slug, manga.description, localCover]
  );

  const mangaId = result.rows[0].id;

  // 🔞 FORCE GENRE 18+
  const genre18 = await db.query(
    `INSERT INTO genres (name)
     VALUES ('18+')
     ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
     RETURNING id`
  );

  const genre18Id = genre18.rows[0].id;

  await db.query(
    `INSERT INTO manga_genres (manga_id, genre_id)
     VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [mangaId, genre18Id]
  );

  // 🔥 scrape chapters dulu
  const chapters = await scrapeChapters(link);
  console.log(`Saved: ${manga.title} (${chapters.length} ch)`);

  // 🔥 SAVE GENRES ASLI (optional tapi bagus)
  if (manga.genres?.length) {
    for (const g of manga.genres) {
      const genreRes = await db.query(
        `INSERT INTO genres (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
         RETURNING id`,
        [g]
      );

      const genreId = genreRes.rows[0].id;

      await db.query(
        `INSERT INTO manga_genres (manga_id, genre_id)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [mangaId, genreId]
      );
    }
  }

  // 📚 SAVE CHAPTERS
  for (const ch of chapters) {
    const chRes = await db.query(
      `INSERT INTO chapters (manga_id, chapter_number, title)
       VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [mangaId, ch.number, ch.title]
    );

    if (!chRes.rows.length) continue;
    const chapterId = chRes.rows[0].id;

    const pages = await scrapePages(ch.url);

    await Promise.all(
      pages.map(async p => {
        const chapterFolder = String(ch.number).replace(".", "-");
        const filename = `${slug}/chapters/${chapterFolder}/${p.order}.jpg`;
        const localUrl = await downloadImage(p.url, filename);

        await db.query(
          `INSERT INTO pages (chapter_id, image_url, page_order)
           VALUES ($1,$2,$3)
           ON CONFLICT DO NOTHING`,
          [chapterId, localUrl, p.order]
        );
      })
    );

    await sleep(200);
  }
}

// async function run() {
//   console.log("START");

//   let all = [];
//   let page = 1;

//   while (true) {
//     try {
//       const list = await scrapeList(page);

//       if (!list.length) {
//         console.log("Last page detected:", page);
//         break;
//       }

//       all.push(...list);
//       page++;

//     } catch (err) {
//       console.log("Stop at page:", page, "(probably last)");
//       break;
//     }
//   }

//   const unique = [...new Map(all.map(i => [i.link, i])).values()];
//   console.log("Total manga found:", unique.length);

//   for (const item of unique) {
//     try {
//       const detail = await scrapeDetail(item.link);
//       await saveFullManga(detail, item.link);
//     } catch (e) {
//       console.log("Skip:", item.title);
//     }
//     await sleep(500);
//   }

//   console.log("DONE");
// }

async function run() {
  console.log("TEST MODE: 1 PAGE ONLY");

  const list = await scrapeList(1); // cuma page 1
  console.log("Page 1 total:", list.length);

  for (const item of list) {
    checkDiskLimit();
    try {
      const detail = await scrapeDetail(item.link);
      await saveFullManga(detail, item.link);
    } catch (e) {
      console.log("Skip:", item.title);
    }
    await sleep(500);
  }

  console.log("DONE TEST");
}

run();