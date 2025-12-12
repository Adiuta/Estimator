const API_BASE = window.API_BASE || (window.location.origin + "/api");

export async function apiGetAuth(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "API Error");
  return json;
}

export async function apiPostAuth(path, data) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "API Error");
  return json;
}

export async function apiPutAuth(path, data) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "API Error");
  return json;
}

export async function apiDeleteAuth(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "API Error");
  return json;
}
