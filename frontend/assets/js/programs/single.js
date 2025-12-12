import { $, $$, el } from "../core/dom.js";
import { fmt2 } from "../core/utils.js";

const API = "http://localhost:3000/api";

let pekerjaanData = [];
let materialsMap = {};
let tenagaMap = {};

let selectedPekerjaan = null;

// ------------ FORMAT NUMBER ------------
function formatNumber(n) {
  if (n == null || isNaN(n)) return "0";
  const v = Number(n);
  return v % 1 === 0 ? v.toString() : v.toFixed(3).replace(/\.?0+$/, "");
}

// ------------ INIT ------------
export async function initSingle() {
  await loadAllData();
  initDropdown(pekerjaanData);
  initSearch();
  initCompute();
}

// ------------ LOAD DATA ------------
async function loadAllData() {
  const [pekerjaan, materials, tenaga] = await Promise.all([
    fetch(`${API}/pekerjaan`).then(r => r.json()),
    fetch(`${API}/materials`).then(r => r.json()),
    fetch(`${API}/tenaga`).then(r => r.json())
  ]);

  pekerjaanData = pekerjaan;
  materialsMap = Object.fromEntries(materials.map(m => [m._id, m]));
  tenagaMap = Object.fromEntries(tenaga.map(t => [t._id, t]));
}

// ------------ DROPDOWN ------------
function initDropdown(list) {
  const select = $("#pekerjaanSelect");
  select.innerHTML = "";

  // placeholder
  const ph = el("option");
  ph.textContent = "— Pilih pekerjaan —";
  ph.disabled = true;
  ph.selected = true;
  select.appendChild(ph);

  list.forEach(item => {
    const op = el("option");
    op.value = item._id;
    op.textContent = item.nama;
    select.appendChild(op);
  });

  // EVENT: selalu update selectedPekerjaan
  select.addEventListener("change", () => {
    selectedPekerjaan = pekerjaanData.find(p => p._id === select.value);
  });
}

// ------------ SEARCH ------------
function initSearch() {
  const input = $("#searchPekerjaan");
  const select = $("#pekerjaanSelect");

  let t = null;

  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const q = input.value.toLowerCase().trim();
      let filtered = pekerjaanData;

      if (q) filtered = pekerjaanData.filter(p => p.nama.toLowerCase().includes(q));

      initDropdown(filtered);

      // IMPORTANT → set selected automatically when 1 result
      if (filtered.length === 1) {
        select.value = filtered[0]._id;
        selectedPekerjaan = filtered[0];
      }
    }, 120);
  });
}

// ------------ COMPUTE ------------
function initCompute() {
  const btn = $("#computeSingle");
  const volInput = $("#volumeSingle");

  btn.addEventListener("click", () => {
    if (!selectedPekerjaan) {
      alert("Pilih pekerjaan dahulu.");
      return;
    }

    const vol = parseFloat(volInput.value);
    if (isNaN(vol) || vol <= 0) {
      alert("Volume tidak valid.");
      return;
    }

    const result = compute(selectedPekerjaan, vol);
    renderResult(result);
  });
}

function compute(pk, volume) {
  const bahan = pk.bahan.map(b => {
    const m = materialsMap[b.materialId];
    return {
      nama: m?.nama || "(Material tidak ditemukan)",
      jumlah: b.koefisien * volume,
      satuan: m?.satuan || "-"
    };
  });

  const tenaga = pk.tenaga.map(t => {
    const w = tenagaMap[t.tenagaId];
    return {
      nama: w?.nama || "(Tenaga tidak ditemukan)",
      jumlah: t.koefisien * volume,
      satuan: w?.satuan || "-"
    };
  });

  return { bahan, tenaga };
}

// ------------ RENDER ------------
function renderResult({ bahan, tenaga }) {
  const tbB = $("#bahanTableSingle tbody");
  const tbT = $("#tenagaTableSingle tbody");

  tbB.innerHTML = "";
  tbT.innerHTML = "";

  bahan.forEach(r => {
    const tr = el("tr");
    tr.innerHTML = `
      <td class="col-name">${r.nama}</td>
      <td class="col-qty align-right">${formatNumber(r.jumlah)}</td>
      <td class="col-unit">${r.satuan}</td>
    `;
    tbB.appendChild(tr);
  });

  tenaga.forEach(r => {
    const tr = el("tr");
    tr.innerHTML = `
      <td class="col-name">${r.nama}</td>
      <td class="col-qty align-right">${formatNumber(r.jumlah)}</td>
      <td class="col-unit">${r.satuan}</td>
    `;
    tbT.appendChild(tr);
  });
}
