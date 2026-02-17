const API = "http://localhost:3000/api";
const token = localStorage.getItem("token");

async function loadDashboard() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:3000/api/manga/stats", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    alert("Token invalid / expired");
    return;
  }

  const data = await res.json();

  document.getElementById("totalManga").innerText =
    data.length + " Manga";
}

function initIntiPage() {
  loadStats();
}
