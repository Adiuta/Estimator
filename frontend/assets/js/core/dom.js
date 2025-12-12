/* dom.js — small DOM helpers */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, children = []) {
  const d = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (k.startsWith("on") && typeof v === "function") d.addEventListener(k.slice(2), v);
    else if (k === "class") d.className = v;
    else if (k === "html") d.innerHTML = v;
    else d.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (typeof c === "string") d.appendChild(document.createTextNode(c));
    else if (c) d.appendChild(c);
  });
  return d;
}
