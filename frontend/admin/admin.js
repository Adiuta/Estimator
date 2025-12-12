// admin.js — single-page admin controller
import { apiGetAuth, apiPostAuth, apiPutAuth, apiDeleteAuth, logout } from "./adminApiClient.js";

// simple DOM helpers
const $ = (s, scope=document)=> scope.querySelector(s);
const $$ = (s, scope=document)=> Array.from(scope.querySelectorAll(s));
const el = (tag, props={})=> Object.assign(document.createElement(tag), props);

const TARGETS = ['dashboard','harga','materials','pekerjaan','tenaga','users','projects'];

function showSection(target) {
  // highlight nav
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.target === target));
  // render content for target
  renderTarget(target);
}

async function initAdmin() {
  // auth check
  try {
    const me = await apiGetAuth("/auth/me");
    if (!me?.user || me.user.role !== "admin") {
      alert("Akses terbatas. Hanya admin.");
      logout();
      window.location.href = "../auth/login.html";
      return;
    }
  } catch (err) {
    console.error("auth check failed:", err);
    logout();
    window.location.href = "../auth/login.html";
    return;
  }

  // bind nav buttons
  $$(".nav-btn").forEach(b => b.addEventListener("click", () => showSection(b.dataset.target)));
  $("#logoutBtn").addEventListener("click", () => { logout(); window.location.href="../auth/login.html"; });

  // initial dashboard
  renderTarget("dashboard");
}

async function renderTarget(target) {
  const container = $("#adminContent");
  const main = document.getElementById("adminMain");
  if (!main) return;

  // reset main content
  main.innerHTML = "";

  if (target === "dashboard") {
    const h = el("h1"); h.textContent = "Dashboard";
    main.appendChild(h);
    main.appendChild(el("p", { className: "muted", textContent: "Ringkasan data" }));

    const grid = el("div", { className: "stats-grid" });
    main.appendChild(grid);

    // fetch counts
    const [pekerjaan, materials, tenaga, projects, users] = await Promise.all([
      apiGetAuth("/pekerjaan"), apiGetAuth("/materials"), apiGetAuth("/tenaga"),
      apiGetAuth("/project/mine").catch(()=>[]), apiGetAuth("/admin/users").catch(()=>[])
    ]);
    const stats = [
      { label:"Pekerjaan", value: (pekerjaan||[]).length },
      { label:"Materials", value: (materials||[]).length },
      { label:"Tenaga", value: (tenaga||[]).length },
      { label:"Proyek", value: (projects||[]).length },
      { label:"User", value: (users||[]).length }
    ];
    stats.forEach(s => {
      const box = el("div", { className: "stat-box" });
      box.innerHTML = `<div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div>`;
      grid.appendChild(box);
    });

    return;
  }

  // For CRUD targets: render header + table + add button + modal container
  const title = {
    materials: "Bahan",
    pekerjaan: "Pekerjaan",
    tenaga: "Tenaga Kerja",
    users: "User",
    projects: "Proyek",
    harga: "Harga / RAB"
  }[target] || target;
  main.appendChild(el("h1", { textContent: title }));

  const topBar = el("div", { className: "admin-topbar" });
  const addBtn = el("button", { className: "btn primary", textContent: "Tambah" });
  topBar.appendChild(addBtn);
  main.appendChild(topBar);

  const tableWrap = el("div", { className: "table-wrap" });
  const table = el("table", { className: "table-premium admin-table" });
  table.innerHTML = `<thead><tr id="adminThead"></tr></thead><tbody id="adminTbody"></tbody>`;
  tableWrap.appendChild(table);
  main.appendChild(tableWrap);

  const modalWrap = el("div", { id: "adminModalWrap" });
  main.appendChild(modalWrap);

  // data loader & table renderer per target
  if (target === "materials") {
    await renderMaterials(addBtn, table);
  } else if (target === "pekerjaan") {
    await renderPekerjaan(addBtn, table);
  } else if (target === "tenaga") {
    await renderTenaga(addBtn, table);
  } else if (target === "users") {
    await renderUsers(addBtn, table);
  } else if (target === "projects") {
    await renderProjects(addBtn, table);
  } else {
    main.appendChild(el("p", { textContent: "Fitur ini akan dibangun." }));
  }
}

// ----------------- MATERIALS -----------------
async function renderMaterials(addBtn, table) {
  addBtn.onclick = () => openMaterialModal();
  const data = await apiGetAuth("/materials");
  const thead = $("#adminThead");
  thead.innerHTML = `<th class="col-name">Nama</th><th>Harga</th><th>Satuan</th><th>Aksi</th>`;
  const tbody = $("#adminTbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = el("tr");
    tr.innerHTML = `<td class="col-name sticky-col">${row.nama}</td>
      <td class="col-qty">${row.harga || 0}</td>
      <td class="col-unit">${row.satuan || "-"}</td>
      <td><button class="btn small" data-id="${row._id}" data-act="edit">edit</button>
          <button class="btn danger small" data-id="${row._id}" data-act="del">hapus</button></td>`;
    tbody.appendChild(tr);
  });
  // bind actions
  $$(".btn[data-act]").forEach(b => b.addEventListener("click", async (ev) => {
    const act = b.dataset.act, id = b.dataset.id;
    if (act === "edit") openMaterialModal(id);
    if (act === "del") {
      if (!confirm("Hapus bahan?")) return;
      await apiDeleteAuth("/admin/materials/" + id);
      alert("Terhapus");
      renderTarget("materials");
    }
  }));
}

function openMaterialModal(id) {
  // build modal
  const wrap = $("#adminModalWrap");
  wrap.innerHTML = `
    <div class="modal-card">
      <h3>${id ? "Edit" : "Tambah"} Bahan</h3>
      <label>Nama<input id="mat_nama" class="input" /></label>
      <label>Harga<input id="mat_harga" class="input" type="number" /></label>
      <label>Satuan<input id="mat_satuan" class="input" /></label>
      <div style="margin-top:12px;text-align:right">
        <button id="matSave" class="btn primary">${id ? "Simpan" : "Tambah"}</button>
        <button id="matClose" class="btn">Batal</button>
      </div>
    </div>
  `;
  $("#matClose").onclick = () => wrap.innerHTML = "";
  $("#matSave").onclick = async () => {
    const nama = $("#mat_nama").value.trim();
    const harga = Number($("#mat_harga").value) || 0;
    const satuan = $("#mat_satuan").value.trim();
    if (!nama) { alert("Nama wajib"); return; }
    try {
      if (id) {
        await apiPutAuth("/admin/materials/" + id, { nama, harga, satuan });
      } else {
        await apiPostAuth("/admin/materials", { nama, harga, satuan });
      }
      wrap.innerHTML = "";
      renderTarget("materials");
    } catch (err) {
      alert("Gagal: " + err.message);
    }
  };
}

// ----------------- PEKERJAAN -----------------
async function renderPekerjaan(addBtn, table) {
  addBtn.onclick = () => openPekerjaanModal();
  const data = await apiGetAuth("/pekerjaan");
  $("#adminThead").innerHTML = `<th>Nama</th><th>Aksi</th>`;
  const tbody = $("#adminTbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = el("tr");
    tr.innerHTML = `<td class="col-name sticky-col">${row.nama}</td>
      <td><button class="btn small" data-id="${row._id}" data-act="edit">edit</button>
          <button class="btn danger small" data-id="${row._id}" data-act="del">hapus</button></td>`;
    tbody.appendChild(tr);
  });
  $$(".btn[data-act]").forEach(b => b.addEventListener("click", async () => {
    const act = b.dataset.act, id = b.dataset.id;
    if (act === "edit") openPekerjaanModal(id);
    if (act === "del") {
      if (!confirm("Hapus pekerjaan?")) return;
      await apiDeleteAuth("/admin/pekerjaan/" + id);
      alert("Terhapus");
      renderTarget("pekerjaan");
    }
  }));
}

function openPekerjaanModal(id) {
  const wrap = $("#adminModalWrap");
  wrap.innerHTML = `
    <div class="modal-card">
      <h3>${id ? "Edit" : "Tambah"} Pekerjaan</h3>
      <label>Nama<input id="pk_nama" class="input" /></label>
      <div style="margin-top:12px;text-align:right">
        <button id="pkSave" class="btn primary">${id ? "Simpan" : "Tambah"}</button>
        <button id="pkClose" class="btn">Batal</button>
      </div>
    </div>
  `;
  $("#pkClose").onclick = () => wrap.innerHTML = "";
  $("#pkSave").onclick = async () => {
    const nama = $("#pk_nama").value.trim();
    if (!nama) { alert("Nama wajib"); return; }
    try {
      if (id) await apiPutAuth("/admin/pekerjaan/" + id, { nama });
      else await apiPostAuth("/admin/pekerjaan", { nama });
      wrap.innerHTML = "";
      renderTarget("pekerjaan");
    } catch (err) {
      alert("Gagal: " + err.message);
    }
  };
}

// ----------------- TENAGA -----------------
async function renderTenaga(addBtn, table) {
  addBtn.onclick = () => openTenagaModal();
  const data = await apiGetAuth("/tenaga");
  $("#adminThead").innerHTML = `<th>Nama</th><th>Harga</th><th>Satuan</th><th>Aksi</th>`;
  const tbody = $("#adminTbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = el("tr");
    tr.innerHTML = `<td class="col-name sticky-col">${row.nama}</td>
      <td class="col-qty">${row.harga || 0}</td>
      <td class="col-unit">${row.satuan || "-"}</td>
      <td><button class="btn small" data-id="${row._id}" data-act="edit">edit</button>
          <button class="btn danger small" data-id="${row._id}" data-act="del">hapus</button></td>`;
    tbody.appendChild(tr);
  });
  $$(".btn[data-act]").forEach(b => b.addEventListener("click", async () => {
    const act = b.dataset.act, id = b.dataset.id;
    if (act === "edit") openTenagaModal(id);
    if (act === "del") {
      if (!confirm("Hapus tenaga?")) return;
      await apiDeleteAuth("/admin/tenaga/" + id);
      alert("Terhapus");
      renderTarget("tenaga");
    }
  }));
}

function openTenagaModal(id) {
  const wrap = $("#adminModalWrap");
  wrap.innerHTML = `
    <div class="modal-card">
      <h3>${id ? "Edit" : "Tambah"} Tenaga</h3>
      <label>Nama<input id="tn_nama" class="input" /></label>
      <label>Harga<input id="tn_harga" class="input" type="number" /></label>
      <label>Satuan<input id="tn_satuan" class="input" /></label>
      <div style="margin-top:12px;text-align:right">
        <button id="tnSave" class="btn primary">${id ? "Simpan" : "Tambah"}</button>
        <button id="tnClose" class="btn">Batal</button>
      </div>
    </div>
  `;
  $("#tnClose").onclick = () => wrap.innerHTML = "";
  $("#tnSave").onclick = async () => {
    const nama = $("#tn_nama").value.trim();
    const harga = Number($("#tn_harga").value) || 0;
    const satuan = $("#tn_satuan").value.trim();
    if (!nama) { alert("Nama wajib"); return; }
    try {
      if (id) await apiPutAuth("/admin/tenaga/" + id, { nama, harga, satuan });
      else await apiPostAuth("/admin/tenaga", { nama, harga, satuan });
      wrap.innerHTML = "";
      renderTarget("tenaga");
    } catch (err) {
      alert("Gagal: " + err.message);
    }
  };
}

// ----------------- USERS -----------------
async function renderUsers(addBtn, table) {
  addBtn.onclick = () => openUserModal();
  const data = await apiGetAuth("/admin/users");
  $("#adminThead").innerHTML = `<th>Username</th><th>Role</th><th>Created</th><th>Aksi</th>`;
  const tbody = $("#adminTbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = el("tr");
    tr.innerHTML = `<td class="col-name sticky-col">${row.username}</td>
      <td>${row.role}</td>
      <td>${new Date(row.createdAt).toLocaleString()}</td>
      <td><button class="btn small" data-id="${row._id}" data-act="del">hapus</button></td>`;
    tbody.appendChild(tr);
  });
  $$(".btn[data-act]").forEach(b => b.addEventListener("click", async () => {
    const id = b.dataset.id;
    if (!confirm("Hapus user?")) return;
    await apiDeleteAuth("/admin/users/" + id);
    alert("Terhapus");
    renderTarget("users");
  }));
}

function openUserModal() {
  const wrap = $("#adminModalWrap");
  wrap.innerHTML = `
    <div class="modal-card">
      <h3>Tambah User</h3>
      <label>Username<input id="u_username" class="input" /></label>
      <label>Password<input id="u_password" class="input" type="password" /></label>
      <label>Role
        <select id="u_role" class="input">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <div style="margin-top:12px;text-align:right">
        <button id="uSave" class="btn primary">Tambah</button>
        <button id="uClose" class="btn">Batal</button>
      </div>
    </div>
  `;
  $("#uClose").onclick = () => wrap.innerHTML = "";
  $("#uSave").onclick = async () => {
    const username = $("#u_username").value.trim();
    const password = $("#u_password").value.trim();
    const role = $("#u_role").value;
    if (!username || !password) { alert("Username & password diperlukan"); return; }
    try {
      await apiPostAuth("/admin/users", { username, password, role });
      wrap.innerHTML = "";
      renderTarget("users");
    } catch (err) {
      alert("Gagal: " + err.message);
    }
  };
}

// ----------------- PROJECTS -----------------
async function renderProjects(addBtn, table) {
  addBtn.style.display = "none";
  const data = await apiGetAuth("/admin/projects");
  $("#adminThead").innerHTML = `<th>Nama</th><th>User</th><th>Tgl</th><th>Aksi</th>`;
  const tbody = $("#adminTbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = el("tr");
    tr.innerHTML = `<td class="col-name sticky-col">${row.name}</td>
      <td>${row.userId?.username || row.userId}</td>
      <td>${new Date(row.createdAt).toLocaleString()}</td>
      <td><button class="btn small" data-id="${row._id}" data-act="view">view</button>
          <button class="btn danger small" data-id="${row._id}" data-act="del">hapus</button></td>`;
    tbody.appendChild(tr);
  });
  $$(".btn[data-act]").forEach(b => b.addEventListener("click", async () => {
    const id = b.dataset.id, act = b.dataset.act;
    if (act === "view") {
      const doc = await apiGetAuth("/project/" + id);
      openProjectViewModal(doc);
    } else if (act === "del") {
      if (!confirm("Hapus proyek?")) return;
      await apiDeleteAuth("/admin/projects/" + id);
      alert("Terhapus");
      renderTarget("projects");
    }
  }));
}

function openProjectViewModal(doc) {
  const wrap = $("#adminModalWrap");
  wrap.innerHTML = `<div class="modal-card">
    <h3>Proyek: ${doc.name}</h3>
    <div><strong>User:</strong> ${doc.userId?.username || doc.userId}</div>
    <div style="margin-top:12px"><strong>Items</strong></div>
    <div>${(doc.items||[]).map(i=>`<div>${i.nama} — ${i.volume}</div>`).join("")}</div>
    <div style="margin-top:12px"><button id="closeProjView" class="btn">Tutup</button></div>
  </div>`;
  $("#closeProjView").onclick = () => wrap.innerHTML = "";
}

// helper utilities for admin API wrappers (put these in adminApiClient.js)
