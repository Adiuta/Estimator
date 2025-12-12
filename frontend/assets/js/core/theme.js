/* theme.js — dark toggle; apply class on html */
export function initTheme(selector) {
  const btn = document.querySelector(selector);
  if (!btn) return;

  const saved = localStorage.getItem("dark") === "1";
  if (saved) document.documentElement.classList.add("dark");

  btn.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("dark", document.documentElement.classList.contains("dark") ? "1" : "0");
  });
}
