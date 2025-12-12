// frontend/assets/js/programs/multi.js
// Multi Estimator PRO — full file
// Requires:
// - ../core/dom.js  -> $ , $$ , el
// - ../core/utils.js -> fmt2
// - ../core/exportExcel.js -> exportExcel(pekerjaanList, rekapBahan, rekapTenaga)
// - ../core/exportPDF.js   -> exportPDF(pekerjaanList, rekapBahan, rekapTenaga)

import { $, $$, el } from "../core/dom.js";
import { fmt2 } from "../core/utils.js";
import { exportExcel } from "../core/exportExcel.js";
import { exportPDF } from "../core/exportPDF.js";

const API = "http://localhost:3000/api";
const STORAGE_KEY = "multiEstimatorCartV1";

// -----------------------------
// State
// -----------------------------
let pekerjaanData = [];
let materialsMap = {};
let tenagaMap = {};
let selectedPekerjaan = null;

let multiItems = []; // { id, nama, volume, bahan[], tenaga[] }

// -----------------------------
// Init
// -----------------------------
export async function initMultiPRO() {
  try {
    await loadAllData();
    loadSavedCart();
    initDropdown();
    initSearch();
    initEvents();
    renderCart();
    renderRekap();
  } catch (err) {
    console.error("initMultiPRO error:", err);
  }
}

// -----------------------------
// Load data from backend
// -----------------------------
async function loadAllData() {
  try {
    const [pRes, mRes, tRes] = await Promise.all([
      fetch(`${API}/pekerjaan`),
      fetch(`${API}/materials`),
      fetch(`${API}/tenaga`)
    ]);

    const [p, m, t] = await Promise.all([
      pRes.ok ? pRes.json() : [],
      mRes.ok ? mRes.json() : [],
      tRes.ok ? tRes.json() : []
    ]);

    pekerjaanData = Array.isArray(p) ? p : [];
    materialsMap = Array.isArray(m) ? Object.fromEntries(m.map(x => [x._id, x])) : {};
    tenagaMap = Array.isArray(t) ? Object.fromEntries(t.map(x => [x._id, x])) : {};
  } catch (err) {
    console.error("Failed to load backend data:", err);
    pekerjaanData = [];
    materialsMap = {};
    tenagaMap = {};
  }
}

// -----------------------------
// Dropdown
// -----------------------------
function initDropdown() {
  buildDropdown(pekerjaanData);

  const select = $("#pekerjaanSelectMulti");
  if (!select) return;

  select.addEventListener("change", () => {
    const id = select.value;
    selectedPekerjaan = pekerjaanData.find(p => p._id === id) || null;
    updateAddBtnState();
  });
}

function buildDropdown(list) {
  const select = $("#pekerjaanSelectMulti");
  if (!select) return;
  select.innerHTML = "";

  const ph = el("option");
  ph.textContent = "— Pilih pekerjaan —";
  ph.disabled = true;
  ph.selected = true;
  select.appendChild(ph);

  (list || []).forEach(item => {
    const op = el("option");
    op.value = item._id;
    op.textContent = item.nama || item.key || item._id;
    select.appendChild(op);
  });

  // reset selectedPekerjaan if current not in list
  if (select.value) {
    const exists = pekerjaanData.find(p => p._id === select.value);
    if (!exists) {
      select.selectedIndex = 0;
      selectedPekerjaan = null;
    }
  }
}

// -----------------------------
// Search
// -----------------------------
function initSearch() {
  const input = $("#searchPekerjaanMulti");
  if (!input) return;

  let t = null;
  input.addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      const q = (e.target.value || "").toLowerCase().trim();
      if (!q) {
        buildDropdown(pekerjaanData);
        return;
      }
      const filtered = pekerjaanData.filter(p => (p.nama || "").toLowerCase().includes(q));
      buildDropdown(filtered);
      // auto-select if 1 result
      if (filtered.length === 1) {
        const select = $("#pekerjaanSelectMulti");
        select.value = filtered[0]._id;
        selectedPekerjaan = filtered[0];
        updateAddBtnState();
      }
    }, 140);
  });
}

// -----------------------------
// Events: add, export, clear, popups
// -----------------------------
function initEvents() {
  // Add button enable logic
  $("#volumeMulti")?.addEventListener("input", updateAddBtnState);

  $("#addItemMulti")?.addEventListener("click", () => {
    if (!selectedPekerjaan) return;
    const vol = parseFloat($("#volumeMulti").value);
    if (!isFinite(vol) || vol <= 0) return;

    const hasil = compute(selectedPekerjaan, vol);
    multiItems.push({
      id: selectedPekerjaan._id,
      nama: selectedPekerjaan.nama,
      volume: vol,
      bahan: hasil.bahan,
      tenaga: hasil.tenaga
    });

    saveCart();
    renderCart();
    renderRekap();
  });

  // Export popup
  $("#exportMulti")?.addEventListener("click", () => {
    $("#exportPopup")?.classList.remove("hidden");
  });
  $("#closeExportPopup")?.addEventListener("click", () => {
    $("#exportPopup")?.classList.add("hidden");
  });

  // Export actions
  $("#exportExcel")?.addEventListener("click", () => {
    try {
      $("#exportPopup")?.classList.add("hidden");
      const { rekapBahan, rekapTenaga } = computeRekap();
      exportExcel(multiItems, rekapBahan, rekapTenaga);
    } catch (err) { console.error("exportExcel error:", err); }
  });

  $("#exportPDF")?.addEventListener("click", () => {
    try {
      $("#exportPopup")?.classList.add("hidden");
      const { rekapBahan, rekapTenaga } = computeRekap();
      exportPDF(multiItems, rekapBahan, rekapTenaga);
    } catch (err) { console.error("exportPDF error:", err); }
  });

  // Clear all (open confirm)
  $("#clearMulti")?.addEventListener("click", () => {
    $("#confirmClear")?.classList.remove("hidden");
  });

  // Confirm clear popup
  $("#confirmClearYes")?.addEventListener("click", () => {
    multiItems = [];
    saveCart();
    renderCart();
    renderRekap();
    $("#confirmClear")?.classList.add("hidden");
  });

  $("#confirmClearNo")?.addEventListener("click", () => {
    $("#confirmClear")?.classList.add("hidden");
  });
  $("#closeConfirmClear")?.addEventListener("click", () => {
    $("#confirmClear")?.classList.add("hidden");
  });
}

// -----------------------------
// Enable/disable add button
// -----------------------------
function updateAddBtnState() {
  const vol = parseFloat($("#volumeMulti")?.value || "");
  const ok = selectedPekerjaan && isFinite(vol) && vol > 0;
  const btn = $("#addItemMulti");
  if (btn) btn.disabled = !ok;
}

// -----------------------------
// Compute per pekerjaan
// -----------------------------
function compute(pekerjaan, volume) {
  const bahan = (pekerjaan.bahan || []).map(b => {
    const m = materialsMap[b.materialId];
    return {
      nama: m?.nama || (b.materialId || "Unknown"),
      jumlah: (Number(b.koefisien) || 0) * volume,
      satuan: m?.satuan || "-"
    };
  });

  const tenaga = (pekerjaan.tenaga || []).map(t => {
    const tn = tenagaMap[t.tenagaId];
    return {
      nama: tn?.nama || (t.tenagaId || "Unknown"),
      jumlah: (Number(t.koefisien) || 0) * volume,
      satuan: tn?.satuan || "-"
    };
  });

  return { bahan, tenaga };
}

// -----------------------------
// Render cart
// -----------------------------
function renderCart() {
  const tbody = $("#multiList");
  if (!tbody) return;
  tbody.innerHTML = "";

  multiItems.forEach((item, idx) => {
    const tr = el("tr");
    tr.innerHTML = `
      <td class="col-name sticky-col">${escapeHtml(item.nama)}</td>
      <td class="col-qty">
        <input class="volume-edit" data-idx="${idx}" type="number" step="0.01" min="0" value="${item.volume}">
      </td>
      <td class="col-unit">
        <button class="btn-delete" data-idx="${idx}" title="Hapus">x</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // attach volume edit handlers
  $$(".volume-edit").forEach(input => {
    input.addEventListener("input", (e) => {
      const idx = Number(input.dataset.idx);
      const v = parseFloat(input.value);
      if (!isFinite(v) || v <= 0) return;
      const item = multiItems[idx];
      if (!item) return;
      item.volume = v;
      // recompute item bahan & tenaga
      const pekerjaan = pekerjaanData.find(p => p._id === item.id);
      if (pekerjaan) {
        const hasil = compute(pekerjaan, v);
        item.bahan = hasil.bahan;
        item.tenaga = hasil.tenaga;
      }
      saveCart();
      renderRekap();
    });
  });

  // attach delete handlers
  $$(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      if (!Number.isFinite(idx)) return;
      multiItems.splice(idx, 1);
      saveCart();
      renderCart();
      renderRekap();
    });
  });
}

// -----------------------------
// Compute rekap totals
// -----------------------------
function computeRekap() {
  const bahan = {};
  const tenaga = {};

  multiItems.forEach(item => {
    (item.bahan || []).forEach(b => {
      if (!bahan[b.nama]) bahan[b.nama] = { jumlah: 0, satuan: b.satuan };
      bahan[b.nama].jumlah += b.jumlah;
    });
    (item.tenaga || []).forEach(t => {
      if (!tenaga[t.nama]) tenaga[t.nama] = { jumlah: 0, satuan: t.satuan };
      tenaga[t.nama].jumlah += t.jumlah;
    });
  });

  return { rekapBahan: bahan, rekapTenaga: tenaga };
}

// -----------------------------
// Render rekap to right panel
// -----------------------------
function renderRekap() {
  const { rekapBahan, rekapTenaga } = computeRekap();

  const tbB = $("#bahanTableMulti tbody");
  const tbT = $("#tenagaTableMulti tbody");
  if (tbB) tbB.innerHTML = "";
  if (tbT) tbT.innerHTML = "";

  Object.entries(rekapBahan).forEach(([nama, d]) => {
    const tr = el("tr");
    tr.innerHTML = `
      <td class="col-name sticky-col">${escapeHtml(nama)}</td>
      <td class="col-qty">${fmt2(d.jumlah)}</td>
      <td class="col-unit">${escapeHtml(d.satuan)}</td>
    `;
    tbB.appendChild(tr);
  });

  Object.entries(rekapTenaga).forEach(([nama, d]) => {
    const tr = el("tr");
    tr.innerHTML = `
      <td class="col-name sticky-col">${escapeHtml(nama)}</td>
      <td class="col-qty">${fmt2(d.jumlah)}</td>
      <td class="col-unit">${escapeHtml(d.satuan)}</td>
    `;
    tbT.appendChild(tr);
  });
}

// -----------------------------
// LocalStorage helpers
// -----------------------------
function saveCart() {
  try {
    const raw = JSON.stringify(multiItems);
    localStorage.setItem(STORAGE_KEY, raw);
  } catch (err) {
    console.warn("saveCart failed:", err);
  }
}

function loadSavedCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved) || saved.length === 0) return;

    // saved items have id & volume; we recompute bahan/tenaga from current master data
    multiItems = saved.map(s => {
      const pk = pekerjaanData.find(p => p._id === s.id);
      if (!pk) return null;
      const vol = Number(s.volume) || 0;
      const hasil = compute(pk, vol);
      return { id: pk._id, nama: pk.nama, volume: vol, bahan: hasil.bahan, tenaga: hasil.tenaga };
    }).filter(Boolean);

  } catch (err) {
    console.warn("loadSavedCart failed:", err);
    multiItems = [];
  }
}

// -----------------------------
// Utilities
// -----------------------------
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
