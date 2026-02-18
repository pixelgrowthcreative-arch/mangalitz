const BASE = window.location.origin;

const API_PAGES = `${BASE}/api/pages`;
const API_CHAPTER = `${BASE}/api/chapters`;
const API_MANGA = `${BASE}/api/manga`;


const mangaSelect = document.getElementById("manga_select");
const chapterSelect = document.getElementById("chapter_id");
const dropZone = document.getElementById("dropZone");

function getToken() {
  return localStorage.getItem("token");
}

if (!getToken()) window.location.href = "/login";

/* ======================
   LOAD MANGA
====================== */
async function loadMangaList() {
  const res = await fetch(`${API_MANGA}/all`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const mangas = await res.json();

  mangaSelect.innerHTML = `<option value="">Pilih Manga</option>`;
  mangas.forEach(m => {
    mangaSelect.innerHTML += `<option value="${m.id}">${m.title}</option>`;
  });
}

/* ======================
   LOAD CHAPTER BY MANGA
====================== */
mangaSelect.addEventListener("change", async () => {
  const mangaId = mangaSelect.value;

  chapterSelect.innerHTML = `<option value="">Pilih Chapter</option>`;
  chapterSelect.disabled = true;

  if (!mangaId) return;

  const res = await fetch(`${API_CHAPTER}/manga/${mangaId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const chapters = await res.json();

  chapters.forEach(ch => {
    chapterSelect.innerHTML += `
      <option value="${ch.id}">Chapter ${ch.chapter_number}</option>
    `;
  });

  chapterSelect.disabled = false;
});

/* ======================
   LOAD PAGES
====================== */
async function loadPages() {
  if (!chapterSelect.value) return;

  const res = await fetch(
    `${API_PAGES}/chapter/${chapterSelect.value}`,
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );

  const pages = await res.json();
  const pageList = document.getElementById("pageList");
  pageList.innerHTML = "";

  pages.forEach(p => {
    const div = document.createElement("div");
    div.className = "page-item";
    div.innerHTML = `
      <img src="${BASE}${p.image_url}">
      <button onclick="deletePage(${p.id})">×</button>
    `;
    pageList.appendChild(div);
  });
}

chapterSelect.addEventListener("change", loadPages);

/* ======================
   UPLOAD PAGES (AUTO SORT)
====================== */
dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("dragover")
);

dropZone.addEventListener("drop", async e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  if (!chapterSelect.value) {
    alert("Pilih manga & chapter dulu");
    return;
  }

  const files = [...e.dataTransfer.files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.append("image", files[i]);
    formData.append("manga_id", mangaSelect.value);
    formData.append("chapter_id", chapterSelect.value);
    formData.append("page_order", i + 1);

    await fetch(API_PAGES, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      },
      body: formData
    });
  }

  await loadPages();
});

/* ======================
   DELETE PAGE
====================== */
async function deletePage(id) {
  if (!confirm("Hapus halaman ini?")) return;

  await fetch(`${API_PAGES}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  loadPages();
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

function previewChapter() {
  if (!chapterSelect.value) {
    alert("Pilih chapter dulu");
    return;
  }

  window.open(
    `admin-reader.html?chapter=${chapterSelect.value}`,
    "_blank"
  );
}

function initPagesPage() {
  loadMangaList();
  bindDropZone();
}


/* INIT */
loadMangaList();
