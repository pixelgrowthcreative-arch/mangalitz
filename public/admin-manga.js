const BASE = window.location.origin;
const API_MANGA = `${BASE}/api/manga`;
const API_GENRES = `${BASE}/api/genres`;

if (!localStorage.getItem("token")) {
  window.location.href = "login.html";
}

function getToken() {
  return localStorage.getItem("token");
}

async function loadMyManga() {
  const res = await fetch(`${API_MANGA}/my`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const mangaList = await res.json();
  const tbody = document.querySelector("#mangaTable tbody");
  tbody.innerHTML = "";

  mangaList.forEach(m => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${m.title}</td>
      <td>${m.status}</td>
      <td>${new Date(m.created_at).toLocaleDateString()}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        ${m.status === 'pending' ? `
          <button onclick="approveManga(${m.id})">Approve</button>
          <button onclick="rejectManga(${m.id})">Reject</button>
        ` : ''}

        <button onclick="deleteManga(${m.id})"
          style="background:#ff4d4d;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer">
          Hapus
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });
}


document.getElementById("mangaForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();

  formData.append("title", title.value);
  formData.append("slug", slug.value);
  formData.append("description", description.value);
  formData.append("age_rating", age_rating.value);

  // 🔥 FILE COVER (INI KUNCI)
  const coverFile = document.getElementById("cover").files[0];
  if (!coverFile) {
    alert("Cover manga wajib dipilih");
    return;
  }
  formData.append("cover", coverFile);

  // GENRES
  const selectedGenres = [...document.querySelectorAll("#genreList input:checked")]
    .map(cb => cb.value);

  selectedGenres.forEach(g => formData.append("genres[]", g));

  await fetch(API_MANGA, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`
    },
    body: formData
  });

  e.target.reset();
  loadMyManga();
});

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

loadMyManga();
loadGenres();

async function approveManga(id) {
  await fetch(`${API_MANGA}/${id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  loadMyManga();
}

async function rejectManga(id) {
  await fetch(`${API_MANGA}/${id}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  loadMyManga();
}

async function loadGenres() {
  const res = await fetch(API_GENRES);
  const genres = await res.json();

  const container = document.getElementById("genreList");
  container.innerHTML = "";

  genres.forEach(g => {
    container.innerHTML += `
      <label>
        <input type="checkbox" value="${g.id}">
        ${g.name}
      </label>
    `;
  });
}

async function deleteManga(id) {
  if (!confirm("Hapus manga ini beserta SEMUA chapter & halaman?")) return;

  await fetch(`${API_MANGA}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  loadMyManga(); // reload list
}

function initMangaPage() {
  loadMyManga();
  loadGenres();

  document
    .getElementById("mangaForm")
    .addEventListener("submit", submitManga);
}


