// dropdown.js
// Shared dropdown builder for Single & Multi Estimator

import { masterData } from "./dataLoader.js";

export function buildDropdown(selectEl, list = masterData.pekerjaan) {
  if (!selectEl) {
    console.warn("[DROPDOWN] select element not found");
    return;
  }

  selectEl.innerHTML = "";

  const ph = document.createElement("option");
  ph.textContent = list.length ? "— Pilih pekerjaan —" : "Tidak ada pekerjaan";
  ph.disabled = true;
  ph.selected = true;
  selectEl.appendChild(ph);

  list.forEach(item => {
    const op = document.createElement("option");
    op.value = item._id ?? item.id;
    op.textContent = item.nama ?? "(tanpa nama)";
    selectEl.appendChild(op);
  });

  console.log("[DROPDOWN] populated:", list.length);
}

export function filterDropdown(query, selectEl) {
  const q = (query || "").toLowerCase();

  const filtered = masterData.pekerjaan.filter(p =>
    (p.nama || "").toLowerCase().includes(q)
  );

  buildDropdown(selectEl, filtered);

  if (filtered.length === 1) {
    selectEl.value = filtered[0]._id;
    return filtered[0];
  }

  return null;
}
