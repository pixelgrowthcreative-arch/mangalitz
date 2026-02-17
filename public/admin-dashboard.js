fetch(`${window.location.origin}/api/manga/stats`
, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
})
.then(res => res.json())
.then(stats => {
  document.getElementById("stat-manga").innerText = `📚 ${stats.manga} Manga`;
  document.getElementById("stat-chapter").innerText = `📖 ${stats.chapter} Chapter`;
  document.getElementById("stat-page").innerText = `🖼 ${stats.page} Pages`;
  document.getElementById("stat-ads").innerText = `📢 ${stats.ads} Ads`;
});
