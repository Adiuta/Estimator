/* popup.js — minimal wrappers for now */
export function toast(msg) {
  // simple accessible toast using alert; replace with custom toast if needed
  alert(msg);
}
export function confirmDelete(msg) {
  return confirm(msg);
}
