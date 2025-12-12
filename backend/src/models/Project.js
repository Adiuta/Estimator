const mongoose = require("mongoose");

const projectItemSchema = new mongoose.Schema({
  pekerjaanId: { type: mongoose.Schema.Types.ObjectId, required: true },
  nama: { type: String },
  volume: { type: Number, default: 0 }
}, { _id: false });

const hasilItemSchema = new mongoose.Schema({
  nama: String,
  jumlah: Number,
  satuan: String
}, { _id: false });

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, default: "Proyek tanpa judul" },
  createdAt: { type: Date, default: () => new Date() },
  items: [projectItemSchema],
  hasil: {
    bahan: [hasilItemSchema],
    tenaga: [hasilItemSchema]
  }
});

module.exports = mongoose.model("Project", projectSchema, "projects");
