// ===========================
// MULTI ESTIMATOR — FINAL
// AFTER REFACTOR
// ===========================

import { $, $$, el } from "../core/dom.js";
import { fmt2 } from "../core/utils.js";
import { loadMasterData, masterData } from "../core/dataLoader.js";
import { buildDropdown, filterDropdown } from "../core/dropdown.js";
import { exportExcel } from "../core/exportExcel.js";
import { exportPDF } from "../core/exportPDF.js";

let selectedPekerjaan = null;
let multiItems = [];

const STORAGE_KEY = "multiEstimatorCartV1";

// ========================================
// INIT
// ========================================
export async function initMultiPRO() {
  await loadMasterData();

  console.log("[MULTI] master data loaded");

  const select = $("#pekerjaanSelectMulti");
  const search = $("#searchPekerjaanMulti");

  buildDropdown(select);

  // SEARCH
  search.addEventListener("input", () => {
    selectedPekerjaan = filterDropdown(search.value, select);
    updateAddBtnState();
  });

  // DROPDOWN
  select.addEventListener("change", () => {
    selectedPekerjaan =
      masterData.pekerjaan.find(p => p._id === select.value);
    updateAddBtnState();
  });

  initEvents();
  loadSavedCart();
  renderCart();
  renderRekap();
}

// ========================================
// BUTTON ENABLE LOGIC
// ========================================
function updateAddBtnState() {
  const vol = parseFloat($("#volumeMulti").value);
  $("#addItemMulti").disabled = !(selectedPekerjaan && vol > 0);
}

// ========================================
// EVENTS
// ========================================
function initEvents() {
  $("#volumeMulti")?.addEventListener("input", updateAddBtnState);

  $("#addItemMulti")?.addEventListener("click", () => {
    const vol = parseFloat($("#volumeMulti").value);
    if (!selectedPekerjaan || !isFinite(vol) || vol <= 0) return;

    const hasil = computeItem(selectedPekerjaan, vol);

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

  // EXPORT POPUP
  $("#exportMulti")?.addEventListener("click", () => {
    $("#exportPopup").classList.remove("hidden");
  });
  $("#closeExportPopup")?.addEventListener("click", () => {
    $("#exportPopup").classList.add("hidden");
  });

  // EXPORT HANDLERS
  $("#exportExcel")?.addEventListener("click", () => {
    $("#exportPopup").classList.add("hidden");
    const { rekapBahan, rekapTenaga } = computeRekap();
    exportExcel(multiItems, rekapBahan, rekapTenaga);
  });

  $("#exportPDF")?.addEventListener("click", () => {
    $("#exportPopup").classList.add("hidden");
    const { rekapBahan, rekapTenaga } = computeRekap();
    exportPDF(multiItems, rekapBahan, rekapTenaga);
  });

  // CLEAR ALL POPUP
  $("#clearMulti")?.addEventListener("click", () => {
    $("#confirmClear").classList.remove("hidden");
  });

  $("#confirmClearYes")?.addEventListener("click", () => {
    multiItems = [];
    saveCart();
    renderCart();
    renderRekap();
    $("#confirmClear").classList.add("hidden");
  });

  $("#confirmClearNo")?.addEventListener("click", () => {
    $("#confirmClear").classList.add("hidden");
  });

  $("#closeConfirmClear")?.addEventListener("click", () => {
    $("#confirmClear").classList.add("hidden");
  });
}

// ========================================
// COMPUTE ITEM
// ========================================
function computeItem(pekerjaan, volume) {
  const bahan = (pekerjaan.bahan || []).map(b => {
    const m = masterData.materialsMap[b.materialId];
    return {
      nama: m?.nama || b.materialId,
      jumlah: (Number(b.koefisien) || 0) * volume,
      satuan: m?.satuan || "-"
    };
  });

  const tenaga = (pekerjaan.tenaga || []).map(t => {
    const tn = masterData.tenagaMap[t.tenagaId];
    return {
      nama: tn?.nama || t.tenagaId,
      jumlah: (Number(t.koefisien) || 0) * volume,
      satuan: tn?.satuan || "-"
    };
  });

  return { bahan, tenaga };
}

// ========================================
// RENDER CART
// ========================================
function renderCart() {
  const tbody = $("#multiList");
  tbody.innerHTML = "";

  multiItems.forEach((item, idx) => {
    const tr = el("tr");

    tr.innerHTML = `
      <td class="col-name sticky-col">${item.nama}</td>

      <td class="col-qty">
        <input class="volume-edit" data-idx="${idx}"
          type="number" step="0.01" min="0" value="${item.volume}">
      </td>

      <td class="col-unit">
        <button class="btn-delete" data-idx="${idx}">x</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Volume edit
  $$(".volume-edit").forEach(input => {
    input.addEventListener("input", () => {
      const idx = Number(input.dataset.idx);
      const v = parseFloat(input.value);
      if (!isFinite(v) || v <= 0) return;

      const item = multiItems[idx];
      const pekerjaan = masterData.pekerjaan.find(p => p._id === item.id);
      const hasil = computeItem(pekerjaan, v);

      item.volume = v;
      item.bahan = hasil.bahan;
      item.tenaga = hasil.tenaga;

      saveCart();
      renderRekap();
    });
  });

  // Hapus
  $$(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      multiItems.splice(idx, 1);
      saveCart();
      renderCart();
      renderRekap();
    });
  });
}

// ========================================
// REKAP
// ========================================
function computeRekap() {
  const bahan = {};
  const tenaga = {};

  multiItems.forEach(item => {
    item.bahan.forEach(b => {
      if (!bahan[b.nama]) bahan[b.nama] = { jumlah: 0, satuan: b.satuan };
      bahan[b.nama].jumlah += b.jumlah;
    });

    item.tenaga.forEach(t => {
      if (!tenaga[t.nama]) tenaga[t.nama] = { jumlah: 0, satuan: t.satuan };
      tenaga[t.nama].jumlah += t.jumlah;
    });
  });

  return { rekapBahan: bahan, rekapTenaga: tenaga };
}

function renderRekap() {
  const { rekapBahan, rekapTenaga } = computeRekap();

  const tbB = $("#bahanTableMulti tbody");
  const tbT = $("#tenagaTableMulti tbody");

  tbB.innerHTML = "";
  tbT.innerHTML = "";

  Object.entries(rekapBahan).forEach(([nama, d]) => {
    const tr = el("tr");
    tr.innerHTML = `
      <td class="col-name sticky-col">${nama}</td>
      <td class="col-qty">${fmt2(d.jumlah)}</td>
      <td class="col-unit">${d.satuan}</td>
    `;
    tbB.appendChild(tr);
  });

  Object.entries(rekapTenaga).forEach(([nama, d]) => {
    const tr = el("tr");
    tr.innerHTML = `
      <td class="col-name sticky-col">${nama}</td>
      <td class="col-qty">${fmt2(d.jumlah)}</td>
      <td class="col-unit">${d.satuan}</td>
    `;
    tbT.appendChild(tr);
  });
}

// ========================================
// STORAGE
// ========================================
function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(multiItems));
}

function loadSavedCart() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  const saved = JSON.parse(raw);
  if (!Array.isArray(saved)) return;

  multiItems = saved.map(s => {
    const pekerjaan = masterData.pekerjaan.find(p => p._id === s.id);
    if (!pekerjaan) return null;

    const hasil = computeItem(pekerjaan, s.volume);

    return {
      id: pekerjaan._id,
      nama: pekerjaan.nama,
      volume: s.volume,
      bahan: hasil.bahan,
      tenaga: hasil.tenaga
    };
  }).filter(Boolean);
}
