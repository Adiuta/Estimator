const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema(
  {
    _id: String,
    nama: String,
    satuan: String
  },
  { collection: "materials", versionKey: false }
);

module.exports =
  mongoose.models.Material || mongoose.model("Material", MaterialSchema);
