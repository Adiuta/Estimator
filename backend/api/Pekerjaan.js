const { connect } = require("../src/db");
const Pekerjaan = require("../src/models/Pekerjaan");

module.exports = async (req, res) => {
  try {
    await connect();
    const data = await Pekerjaan.find({}).lean().exec();
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal_error" });
  }
};
