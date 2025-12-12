const mongoose = require("mongoose");

const BahanSchema = new mongoose.Schema(
  {
    materialId: String,
    koefisien: Number
  },
  { _id: false }
);

const TenagaSchema = new mongoose.Schema(
  {
    tenagaId: String,
    koefisien: Number
  },
  { _id: false }
);

const PekerjaanSchema = new mongoose.Schema(
  {
    _id: String,
    nama: String,
    bahan: [BahanSchema],
    tenaga: [TenagaSchema]
  },
  { collection: "pekerjaan", versionKey: false }
);

module.exports =
  mongoose.models.Pekerjaan || mongoose.model("Pekerjaan", PekerjaanSchema);
