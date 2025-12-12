// helpers.js
// General utilities used across Single & Multi Estimator

// Escape HTML to avoid injection issues
export function escapeHTML(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Simple debounce
export function debounce(fn, delay = 200) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// Deep clone JSON
export function clone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

// Normalize number (avoid "NaN" situations)
export function num(x) {
  const n = Number(x);
  return isFinite(n) ? n : 0;
}

// Generate random ID (optional utility)
export function uid() {
  return "id_" + Math.random().toString(36).slice(2, 10);
}
