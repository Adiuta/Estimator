import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

export function exportExcel(pekerjaanList, rekapBahan, rekapTenaga) {

  const sheet1 = [
    ["No", "Nama Pekerjaan", "Volume"],
    ...pekerjaanList.map((p, i) => [
      i + 1, p.nama, p.volume
    ])
  ];

  const sheet2 = [
    ["REKAP BAHAN"],
    ["Nama Bahan", "Jumlah", "Satuan"],
    ...Object.entries(rekapBahan).map(([nama, d]) => [nama, d.jumlah, d.satuan]),
    [],
    ["REKAP TENAGA"],
    ["Nama Tenaga", "Jumlah", "Satuan"],
    ...Object.entries(rekapTenaga).map(([nama, d]) => [nama, d.jumlah, d.satuan])
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet1), "Pekerjaan");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet2), "Rekap");

  XLSX.writeFile(wb, "Estimator_Multi.xlsx");
}
