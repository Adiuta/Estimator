import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";
import autoTable from "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.28/+esm";

export function exportPDF(pekerjaanList, rekapBahan, rekapTenaga) {

  const doc = new jsPDF("p", "mm", "a4");

  doc.setFontSize(16);
  doc.text("Daftar Pekerjaan", 14, 16);

  autoTable(doc, {
    startY: 24,
    head: [["No", "Nama Pekerjaan", "Volume"]],
    body: pekerjaanList.map((p, i) => [
      i + 1, p.nama, p.volume
    ]),
    styles: { fontSize: 10 }
  });

  doc.addPage();

  doc.setFontSize(16);
  doc.text("Rekap Bahan", 14, 16);

  autoTable(doc, {
    startY: 24,
    head: [["Nama Bahan", "Jumlah", "Satuan"]],
    body: Object.entries(rekapBahan).map(([nama, d]) => [
      nama, d.jumlah, d.satuan
    ]),
    styles: { fontSize: 10 }
  });

  doc.text("Rekap Tenaga", 14, doc.lastAutoTable.finalY + 12);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [["Nama Tenaga", "Jumlah", "Satuan"]],
    body: Object.entries(rekapTenaga).map(([nama, d]) => [
      nama, d.jumlah, d.satuan
    ]),
    styles: { fontSize: 10 }
  });

  doc.save("Estimator_Multi.pdf");
}
