const token = localStorage.getItem("token");
if (!token) location.href = "login.html";

function logout() {
  localStorage.removeItem("token");
  location.href = "login.html";
}

const view = document.getElementById("admin-view");
const buttons = document.querySelectorAll(".menu-btn");

async function loadAdminPage(file) {
  // 1. load HTML
  const res = await fetch(file);
  const html = await res.text();
  view.innerHTML = html;

  // 2. hapus JS lama
  const old = document.getElementById("admin-dynamic-js");
  if (old) old.remove();

  // 3. load JS baru
  const jsFile = file.replace(".html", ".js");
  const script = document.createElement("script");
  script.src = jsFile;
  script.id = "admin-dynamic-js";

  script.onload = () => {
    if (window.initIntiPage) window.initIntiPage();
    if (window.initMangaPage) window.initMangaPage();
    if (window.initChapterPage) window.initChapterPage();
    if (window.initPagesPage) window.initPagesPage();
    if (window.initReaderPage) window.initReaderPage();
  };

  document.body.appendChild(script);
}

buttons.forEach(btn => {
  btn.onclick = () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadAdminPage(btn.dataset.page);
  };
});

// default
loadAdminPage("admin-inti.html");
