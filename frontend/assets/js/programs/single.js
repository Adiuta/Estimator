// ===========================
// SINGLE ESTIMATOR — FINAL FIX
// ===========================

import { $, el } from "../core/dom.js";
import { fmt2 } from "../core/utils.js";
import { loadMasterData, masterData } from "../core/dataLoader.js";
import { buildDropdown, filterDropdown } from "../core/dropdown.js";

let selectedPekerjaan = null;

// ========================================
// INIT
// ========================================
export async function initSingle() {
  await loadMasterData();

  console.log("[SINGLE] master data loaded");

  // ==== MATCH with single.html ====
  const select = $("#pekerjaanSelect");
  const search = $("#searchPekerjaan");
  const volumeInput = $("#volumeSingle");
  const hitungBtn = $("#computeSingle");

  buildDropdown(select);

  // Search handler
  search.addEventListener("input", () => {
    selectedPekerjaan = filterDropdown(search.value, select);
    updateButtonState();
  });

  // Dropdown handler
  select.addEventListener("change", () => {
    selectedPekerjaan =
      masterData.pekerjaan.find(p => p._id === select.value);
    updateButtonState();
  });

  // Volume handler
  volumeInput.addEventListener("input", updateButtonState);

  // Hitung klik
  hitungBtn.addEventListener("click", () => {
    const volume = parseFloat(volumeInput.value);
    if (!selectedPekerjaan || !isFinite(volume) || volume <= 0) return;

    hitungSingle(selectedPekerjaan, volume);
  });

  updateButtonState();
}

// ========================================
// ENABLE / DISABLE BUTTON
// ========================================
function updateButtonState() {
  const volume = parseFloat($("#volumeSingle").value);
  $("#computeSingle").disabled =
    !(selectedPekerjaan && isFinite(volume) && volume > 0);
}

// ========================================
// HITUNG
// ========================================
function hitungSingle(pekerjaan, volume) {
  const bahanTable = $("#bahanTableSingle tbody");
  const tenagaTable = $("#tenagaTableSingle tbody");

  bahanTable.innerHTML = "";
  tenagaTable.innerHTML = "";

  // ======================
  // BAHAN
  // ======================
  (pekerjaan.bahan || []).forEach(b => {
    const m = masterData.materialsMap[b.materialId];
    const jumlah = (Number(b.koefisien) || 0) * volume;
    const nama = m?.nama || b.materialId;
    const satuan = m?.satuan || "-";

    const tr = el("tr");
    tr.innerHTML = `
      <td class="col-name sticky-col">${nama}</td>
      <td class="col-qty">${fmt2(jumlah)}</td>
      <td class="col-unit">${satuan}</td>
    `;
    bahanTable.appendChild(tr);
  });

  // ======================
  // TENAGA
  // ======================
  (pekerjaan.tenaga || []).forEach(t => {
    const tn = masterData.tenagaMap[t.tenagaId];
    const jumlah = (Number(t.koefisien) || 0) * volume;
    const nama = tn?.nama || t.tenagaId;
    const satuan = tn?.satuan || "-";

    const tr = el("tr");
    tr.innerHTML = `
      <td class="col-name sticky-col">${nama}</td>
      <td class="col-qty">${fmt2(jumlah)}</td>
      <td class="col-unit">${satuan}</td>
    `;
    tenagaTable.appendChild(tr);
  });
}
