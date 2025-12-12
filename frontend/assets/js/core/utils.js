/* utils.js — formatting and finders */
export const ceil2 = v => Math.ceil((Number(v) || 0) * 100) / 100;
export const fmt2 = v => (Number(v) || 0).toFixed(2);

let _materials = [], _tenaga = [], _pekerjaan = [];

export function setData({ materials, tenaga, pekerjaan }) {
  _materials = materials || [];
  _tenaga = tenaga || [];
  _pekerjaan = pekerjaan || [];
}

export function findMaterial(key) {
  return _materials.find(m =>
    m._id === key ||
    m.key === key ||
    (m.nama && m.nama.toLowerCase() === String(key).toLowerCase())
  ) || null;
}

export function findTenaga(key) {
  return _tenaga.find(t =>
    t._id === key ||
    t.key === key ||
    (t.nama && t.nama.toLowerCase() === String(key).toLowerCase())
  ) || null;
}
