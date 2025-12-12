// authClient.js - small client helper for auth
const API_BASE = window.API_BASE || (window.location.origin.includes("http") ? (window.location.origin + "/api") : "/api");

// low-level POST
export async function apiPost(path, body) {
  const url = `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Request failed");
  return json;
}

export async function apiGet(path) {
  const url = `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: "Bearer " + token } : {};
  const res = await fetch(url, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Request failed");
  return json;
}

export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function logout() {
  localStorage.removeItem("token");
}

export function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: "Bearer " + token } : {};
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}
