// MULTI ESTIMATOR — FINAL with Save Project (requires login)
import { $, $$, el } from "../core/dom.js";
import { fmt2 } from "../core/utils.js";
import { loadMasterData, masterData } from "../core/dataLoader.js";
import { buildDropdown, filterDropdown } from "../core/dropdown.js";
import { apiPost, apiGet, saveToken, getAuthHeader, isLoggedIn } from "../core/authClient.js";

let selectedPekerjaan = null;
let multiItems = [];

const STORAGE_KEY = "multiEstimatorCartV1";

// init
export async function initMultiPRO() {
  await loadMasterData();
  console.log("[MULTI] master data loaded");

  const select = $("#pekerjaanSelectMulti");
  const search = $("#searchPekerjaanMulti");

  buildDropdown(select);

  search.addEventListener("input", () => {
    selectedPekerjaan = filterDropdown(search.value, select);
    updateAddBtnState();
  });

  select.addEventListener("change", () => {
    selectedPekerjaan =
      masterData.pekerjaan.find(p => p._id === select.value);
    updateAddBtnState();
  });

  initEvents();
  loadSavedCart();
  renderCart();
  renderRekap();
  updateSaveButtonUI();
}

// BUTTON LOGIC
function updateAddBtnState() {
  const vol = parseFloat($("#volumeMulti").value);
  $("#addItemMulti").disabled = !(selectedPekerjaan && vol > 0);
}

// events
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
    updateSaveButtonUI();
  });

  // SAVE PROJECT BUTTON
  $("#saveProjectMulti")?.addEventListener("click", async () => {
    if (!isLoggedIn()) {
      // redirect to login, remember return URL
      sessionStorage.setItem("afterLoginRedirect", window.location.href);
      // either open popup or redirect - we will redirect to /auth/login.html
      window.location.href = "../auth/login.html";
      return;
    }

    if (multiItems.length === 0) {
      alert("Keranjang kosong, tidak ada proyek untuk disimpan.");
      return;
    }

    // prepare payload: name, items, hasil
    const name = prompt("Nama proyek (opsional):", "Proyek Estimator");
    const items = multiItems.map(i => ({ pekerjaanId: i.id, nama: i.nama, volume: i.volume }));
    const hasil = {
      bahan: computeRekap().rekapBahan ? Object.entries(computeRekap().rekapBahan).map(([nama,d]) => ({ nama, jumlah: d.jumlah, satuan: d.satuan })) : [],
      tenaga: computeRekap().rekapTenaga ? Object.entries(computeRekap().rekapTenaga).map(([nama,d]) => ({ nama, jumlah: d.jumlah, satuan: d.satuan })) : []
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${window.API_BASE || (window.location.origin + "/api")}/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
        body: JSON.stringify({ name, items, hasil })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Save failed");
      alert("Proyek tersimpan.");
    } catch (err) {
      alert("Gagal menyimpan proyek: " + err.message);
    }
  });

  // export popup handlers (assuming you have these buttons)
  $("#exportMulti")?.addEventListener("click", () => {
    $("#exportPopup").classList.remove("hidden");
  });
  $("#closeExportPopup")?.addEventListener("click", () => {
    $("#exportPopup").classList.add("hidden");
  });

  $("#clearMulti")?.addEventListener("click", () => {
    $("#confirmClear").classList.remove("hidden");
  });

  $("#confirmClearYes")?.addEventListener("click", () => {
    multiItems = [];
    saveCart();
    renderCart();
    renderRekap();
    $("#confirmClear").classList.add("hidden");
    updateSaveButtonUI();
  });

  $("#confirmClearNo")?.addEventListener("click", () => {
    $("#confirmClear").classList.add("hidden");
  });
}

// compute item
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

// render cart
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

  // bind events
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
      updateSaveButtonUI();
    });
  });

  $$(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      multiItems.splice(idx, 1);
      saveCart();
      renderCart();
      renderRekap();
      updateSaveButtonUI();
    });
  });
}

// rekap
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

// storage
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

// update save button UI (disable if no items)
function updateSaveButtonUI() {
  const btn = $("#saveProjectMulti");
  if (!btn) return;
  btn.disabled = multiItems.length === 0;
  // if not logged in, clicking will redirect to login (handled by handler)
}

// export helper placeholders (you may implement exportExcel / exportPDF)
export function exportExcel(items, bahan, tenaga) {
  console.warn("exportExcel not implemented in this build.");
}
export function exportPDF(items, bahan, tenaga) {
  console.warn("exportPDF not implemented in this build.");
}
