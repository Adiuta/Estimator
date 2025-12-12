// utils.js
// Formatting & math helpers

// Format decimal to 2 decimal places
export function fmt2(val) {
  const n = Number(val);
  if (!isFinite(n)) return "0.00";
  return n.toFixed(2);
}

// Format with thousand separators
export function fmtNum(val) {
  const n = Number(val);
  if (!isFinite(n)) return "0";
  return n.toLocaleString("id-ID");
}

// Format currency (if needed for future RAB)
export function fmtRp(val) {
  const n = Number(val);
  if (!isFinite(n)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR"
  }).format(n);
}
