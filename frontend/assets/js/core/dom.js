// dom.js
// Lightweight DOM helpers for cleaner code

export const $ = (q, scope = document) => scope.querySelector(q);
export const $$ = (q, scope = document) => [...scope.querySelectorAll(q)];

export function el(tag, props = {}) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  return e;
}

// Add CSS class
export function addClass(el, cls) {
  if (el) el.classList.add(cls);
}

// Remove CSS class
export function removeClass(el, cls) {
  if (el) el.classList.remove(cls);
}

// Toggle CSS class
export function toggleClass(el, cls) {
  if (el) el.classList.toggle(cls);
}
