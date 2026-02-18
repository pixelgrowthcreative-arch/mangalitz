const API_BASE = window.location.origin;
const API_ADMIN = `${API_BASE}/api/ads`;

function getToken() {
  return localStorage.getItem("token");
}

if (!getToken()) {
  window.location.href = "/login";
}

async function loadAds() {
  const res = await fetch(API_ADMIN, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  if (res.status === 401) {
    alert("Session habis, login ulang.");
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  const ads = await res.json();

  const tbody = document.querySelector("#adsTable tbody");
  tbody.innerHTML = "";

  ads.forEach(ad => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${ad.title}</td>
      <td>${ad.position}</td>
      <td>${ad.is_active ? "Aktif" : "Nonaktif"}</td>
      <td>${ad.impressions || 0}</td>
      <td>${ad.clicks || 0}</td>
      <td>
        <button onclick="toggleAd(${ad.id})">Toggle</button>
        <button onclick="deleteAd(${ad.id})" style="background:#ff4d4d;margin-left:5px;">Hapus</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function toggleAd(id) {
  await fetch(`${API_ADMIN}/${id}/toggle`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  loadAds();
}

document.getElementById("adForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const ad = {
    title: document.getElementById("title").value,
    image_url: document.getElementById("image_url").value,
    target_url: document.getElementById("target_url").value,
    position: document.getElementById("position").value
  };

  await fetch(API_ADMIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify(ad)
  });

  e.target.reset();
  loadAds();
});

async function deleteAd(id) {
  if (!confirm("Yakin mau hapus iklan ini?")) return;

  await fetch(`${API_ADMIN}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  loadAds();
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

loadAds();
