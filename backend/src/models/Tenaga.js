const mongoose = require("mongoose");

const TenagaSchema = new mongoose.Schema(
  {
    _id: String,
    nama: String,
    satuan: String
  },
  { collection: "tenaga", versionKey: false }
);

module.exports =
  mongoose.models.Tenaga || mongoose.model("Tenaga", TenagaSchema);
