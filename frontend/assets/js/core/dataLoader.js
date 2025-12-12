// frontend/assets/js/core/dataLoader.js
const API = window.API_BASE || (window.location.origin.includes("http") ? (window.location.origin + "/api") : "/api");

export const masterData = {
  pekerjaan: [],
  materialsMap: {},
  tenagaMap: {},
  loaded: false
};

// create simple overlay for fatal errors
function showOverlay(message) {
  let o = document.getElementById("__dataErrorOverlay");
  if (!o) {
    o = document.createElement("div");
    o.id = "__dataErrorOverlay";
    Object.assign(o.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      fontFamily: "system-ui, sans-serif"
    });
    o.innerHTML = `
      <div style="background:var(--card,white);padding:20px;border-radius:10px;max-width:540px;text-align:left;box-shadow:0 8px 30px rgba(0,0,0,0.2);">
        <h3 style="margin:0 0 8px 0">Koneksi API gagal</h3>
        <p style="margin:0 0 12px 0;color:#334155">${message}</p>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button id="__retryApiBtn" style="padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc;cursor:pointer">Retry</button>
        </div>
      </div>
    `;
    document.body.appendChild(o);
    document.getElementById("__retryApiBtn").addEventListener("click", () => {
      o.remove();
      // try loading again
      loadMasterData().catch(()=>{});
    });
  } else {
    o.querySelector("p").textContent = message;
    o.style.display = "flex";
  }
}

async function fetchOrThrow(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

export async function loadMasterData() {
  if (masterData.loaded) return masterData;

  try {
    // try pekerjaan first
    const p = await fetchOrThrow(`${API}/pekerjaan`);
    const m = await fetchOrThrow(`${API}/materials`);
    const t = await fetchOrThrow(`${API}/tenaga`);

    masterData.pekerjaan = Array.isArray(p) ? p : [];
    masterData.materialsMap = Object.fromEntries((m||[]).map(x => [x._id ?? x.id, x]));
    masterData.tenagaMap = Object.fromEntries((t||[]).map(x => [x._id ?? x.id, x]));
    masterData.loaded = true;

    console.log("[MASTER] loaded from API:", masterData.pekerjaan.length, "pekerjaan");
    return masterData;
  } catch (err) {
    console.error("[MASTER] api load failed:", err.message);
    showOverlay(`Tidak dapat menghubungi backend API (${API}). Pastikan backend berjalan dan MONGODB_URI sudah terpasang. Error: ${err.message}`);
    // leave masterData empty but not throw further
    masterData.loaded = false;
    masterData.pekerjaan = [];
    masterData.materialsMap = {};
    masterData.tenagaMap = {};
    throw err; // let caller decide (init will catch)
  }
}
