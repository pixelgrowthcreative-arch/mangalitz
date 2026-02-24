const API_AUTH = `${window.location.origin}/api/auth/login`;


document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch(API_AUTH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      password: password.value
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert("Login gagal");
    return;
  }

  localStorage.setItem("token", data.token);
  window.location.href = "/admin";
});
