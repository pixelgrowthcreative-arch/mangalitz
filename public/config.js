const BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : window.location.origin;

const API = `${BASE}/api/public`;

const API_GENRES = `${window.location.origin}/api/genres`;

// PUBLIC API
const PUBLIC_API = `${API}/public`;
