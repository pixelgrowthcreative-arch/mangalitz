const BASE = window.location.origin;
const API_CHAPTER = `${BASE}/api/chapters`;
const API_MANGA = `${BASE}/api/manga`;

function getToken() {
  return localStorage.getItem("token");
}

if (!getToken()) {
  window.location.href = "/login";
}

document.addEventListener("DOMContentLoaded", () => {
  const chapterForm = document.getElementById("chapterForm");
  const mangaSelect = document.getElementById("manga_id");

  loadMangaOptions();
  loadChapters();

  if (chapterForm) {
    chapterForm.addEventListener("submit", async e => {
      e.preventDefault();

      await fetch(API_CHAPTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          manga_id: mangaSelect.value,
          chapter_number: document.getElementById("chapter_number").value,
          title: document.getElementById("title").value
        })
      });

      chapterForm.reset();
      loadChapters();
    });
  }
});

async function loadMangaOptions() {
  const res = await fetch(`${API_MANGA}/all`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const mangas = await res.json();
  const mangaSelect = document.getElementById("manga_id");

  if (!mangaSelect) return;

  mangaSelect.innerHTML = mangas
    .map(m => `<option value="${m.id}">${m.title}</option>`)
    .join("");
}

async function loadChapters() {
  const res = await fetch(API_CHAPTER, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const chapters = await res.json();
  const tbody = document.querySelector("#chapterTable tbody");

  if (!tbody) return;

  tbody.innerHTML = "";

  chapters.forEach(ch => {
    tbody.innerHTML += `
      <tr>
        <td>${ch.manga_title}</td>
        <td>${ch.chapter_number}</td>
        <td>${ch.title || "-"}</td>
        <td>
          <button onclick="deleteChapter(${ch.id})"
            style="background:#ff4d4d;color:#fff;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;">
            Hapus
          </button>
        </td>
      </tr>
    `;
  });
}

async function deleteChapter(id) {
  if (!confirm("Hapus chapter ini beserta semua halamannya?")) return;

  await fetch(`${API_CHAPTER}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  loadChapters();
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}
