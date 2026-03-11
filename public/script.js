/* ===============================
   GLOBAL CONFIG
=============================== */
// pakai config global
const BASE = "https://mangalitz.onrender.com";
const CDN = "http://62.146.233.124:3001";

const API = `${BASE}/api/public`;
const BASE_URL = BASE;

function fixCover(url) {

  if (!url) return "assets/no-cover.jpg";

  if (url.startsWith("http")) return url;

  return "http://62.146.233.124:3001" + url;

}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ===============================
   HOME
=============================== */
let allManga = [];
let activeGenre = null;
let currentLang = localStorage.getItem("lang") || "th";

async function loadMangaList() {
  const container = document.getElementById("hentai-section");

  try {
    const res = await fetch(API + "/manga");
    const data = await res.json();

    allManga = data.map(m => ({
      ...m,
      genres: Array.isArray(m.genres)
        ? m.genres
        : (m.genres || "").split(",")
    })).filter(m => m.genres.includes("18+"));

    renderManga(allManga);
    renderGenreFilters();

  } catch (err) {
    console.error("LOAD ERROR:", err);
    container.innerHTML = "Failed load manga";
  }
}

function renderManga(mangaArray) {
  const container = document.getElementById("hentai-section");
  if (!container) return;

  container.innerHTML = "";

  mangaArray.forEach(m => {
    const div = document.createElement("div");
    div.className = "manga-card";

    div.innerHTML = `
      <img 
        src="${fixCover(m.cover_image)}"
        onerror="this.src='assets/no-cover.jpg'"
        loading="lazy"
      />
      <h3>${m.title}</h3>
    `;

    div.onclick = () => (window.location.href = `manga.html?id=${m.id}`);
    container.appendChild(div);
  });
}

/* ===============================
   MANGA DETAIL (SEO + VIEW)
=============================== */
async function loadMangaDetail() {
  const id = getParam("id");
  if (!id) return;

  // tambah view dulu
  await fetch(`${API}/manga/${id}/view`, { method: "POST" });

  const res = await fetch(`${API}/manga/${id}`);
  const data = await res.json();

  if (!data || data.error) {
    document.body.innerHTML = "<h2>Manga not found</h2>";
    return;
  }

  // ===== SEO THAI =====
  document.title = `อ่าน ${data.title} แปลไทยฟรี - MangaLitz`;

  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute(
      "content",
      `อ่าน ${data.title} แปลไทยฟรี อัปเดตล่าสุดที่ MangaLitz`
    );
  }

  // ===== HERO COVER =====
  const coverUrl = fixCover(data.cover_image);
  const hero = document.getElementById("hero");
  const cover = document.getElementById("cover");

  if (hero) hero.style.backgroundImage = `url(${coverUrl})`;
  if (cover) cover.src = coverUrl;

  // ===== TEXT =====
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");

  if (titleEl) titleEl.innerText = data.title;
  if (descEl) descEl.innerText = data.description;

  // ===== CHAPTER LIST =====
  const list = document.getElementById("chapter-list");
  if (!list) return;

  list.innerHTML = "";

  data.chapters.forEach(ch => {
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="reader.html?id=${ch.id}">
        Chapter ${ch.chapter_number} - ${ch.title || ""}
      </a>
    `;
    list.appendChild(li);
  });
}

/* ===============================
   READER
=============================== */
async function loadReader() {
  const id = getParam("id");
  if (!id) return;

  const res = await fetch(`${API}/chapter/${id}`);
  const pages = await res.json();

  const container = document.getElementById("pages");
  if (!container) return;

  container.innerHTML = "";

  if (!pages.length) {
    container.innerHTML = "<p>No pages yet</p>";
    return;
  }

  pages.forEach(p => {
    const img = document.createElement("img");
    img.src = fixCover(p.image_url);
    img.alt = `manga page ${p.page_order}`;
    container.appendChild(img);
  });
}

/* ===============================
   SEARCH + GENRE FILTER
=============================== */
function filterManga() {
  const keyword = document
    .getElementById("searchInput")
    ?.value.toLowerCase() || "";

  let filtered = allManga.filter(m =>
    m.title.toLowerCase().includes(keyword)
  );

  if (activeGenre) {
    filtered = filtered.filter(m =>
      m.genres && m.genres.includes(activeGenre)
    );
  }

  renderSection(filtered);
}

function renderGenreFilters() {
  const container = document.getElementById("genre-filters");
  if (!container) return;

  container.innerHTML = "";

  const genresSet = new Set();

  allManga.forEach(m => {
    if (!m.genres) return;

    // support array OR string
    const genres = Array.isArray(m.genres)
      ? m.genres
      : m.genres.split(",");

    genres.forEach(g => genresSet.add(g.trim()));
  });

  // tombol ALL
  const reset = document.createElement("span");
  reset.className = "genre-btn active";
  reset.innerText = "All";
  reset.onclick = () => {
    activeGenre = null;
    filterManga();
  };
  container.appendChild(reset);

  genresSet.forEach(genre => {
    const btn = document.createElement("span");
    btn.className = "genre-btn";
    btn.innerText = genre;
    btn.onclick = () => {
      activeGenre = genre;
      filterManga();
    };
    container.appendChild(btn);
  });
}

/* ===============================
   ADS TRACKING
=============================== */
async function trackImpression(id) {
  await fetch(`${API}/ads/${id}/impression`, { method: "POST" });
}

async function trackClick(id) {
  await fetch(`${API}/ads/${id}/click`, { method: "POST" });
}

function renderAdToElement(ad, el) {
  if (!el) return;

  el.innerHTML = `
    <a href="${ad.target_url}" target="_blank" onclick="trackClick(${ad.id})">
      <img src="${ad.image_url}" style="max-width:100%; border-radius:8px;">
    </a>
  `;
  trackImpression(ad.id);
}

async function loadMultipleAds(position, prefixId, count) {
  const res = await fetch(`${API}/ads/${position}/multiple/${count}`);
  const ads = await res.json();

  ads.forEach((ad, i) => {
    const el = document.getElementById(`${prefixId}-${i + 1}`);
    renderAdToElement(ad, el);
  });
}

async function loadGenreSection(genreName, containerId) {
  const res = await fetch(`${API}/genre/${genreName}`);
  const data = await res.json();

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  data.forEach(m => {
    const div = document.createElement("div");
    div.className = "manga-card";
    div.innerHTML = `
      <img src="${fixCover(m.cover_image)}">
      <h3>${m.title}</h3>
    `;
    div.onclick = () => (window.location.href = `manga.html?id=${m.id}`);
    container.appendChild(div);
  });
}

function renderSection(mangaArray){
  const container = document.getElementById("hentai-section");
  if (!container) return;

  container.innerHTML = "";

  mangaArray.forEach(m => {
    const div = document.createElement("div");
    div.className = "manga-card";
    div.innerHTML = `
      <img src="${fixCover(m.cover_image)}">
      <h3>${m.title}</h3>
    `;
    div.onclick = () => (window.location.href = `manga.html?id=${m.id}`);
    container.appendChild(div);
  });
}

function renderGenreSection(genreName, containerId, sourceData = allManga) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const filtered = sourceData.filter(m =>
    m.genres && m.genres.includes(genreName)
  );

  container.innerHTML = "";

  filtered.forEach(m => {
    const div = document.createElement("div");
    div.className = "manga-card";
    div.innerHTML = `
      <img src="${m.cover_image.startsWith('http') ? m.cover_image : BASE_URL + m.cover_image}">
      <h3>${m.title}</h3>
    `;
    div.onclick = () => (window.location.href = `manga.html?id=${m.id}`);
    container.appendChild(div);
  });
}

/* ===============================
   LANGUAGE SYSTEM
=============================== */

const translations = {
  th: {
    mangaList: "รายการมังงะ",
    searchPlaceholder: "ค้นหามังงะ...",
    manga: "มังงะ",
    manhwa: "มันฮวา",
    manhua: "มันฮัว",
    hentai: "เฮ็นไท"
  },
  en: {
    mangaList: "Manga List",
    searchPlaceholder: "Search manga...",
    manga: "Manga",
    manhwa: "Manhwa",
    manhua: "Manhua",
    hentai: "Hentai"
  }
};


function applyLanguage() {
  document.querySelectorAll("[data-th]").forEach(el => {
    el.innerText = el.dataset[currentLang];
  });

  document.querySelectorAll("[data-th-placeholder]").forEach(el => {
    el.placeholder = el.dataset[currentLang + "Placeholder"];
  });
}


function setLang(lang){
  currentLang = lang;
  localStorage.setItem("lang", lang);
  applyLanguage();
}

document.addEventListener("DOMContentLoaded", applyLanguage);
