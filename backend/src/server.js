require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { connect } = require("./db");
const Material = require("./models/Material");
const Tenaga = require("./models/Tenaga");
const Pekerjaan = require("./models/Pekerjaan");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/api/materials", async (req, res) => {
  await connect();
  res.json(await Material.find({}).lean());
});

app.get("/api/tenaga", async (req, res) => {
  await connect();
  res.json(await Tenaga.find({}).lean());
});

app.get("/api/pekerjaan", async (req, res) => {
  await connect();
  res.json(await Pekerjaan.find({}).lean());
});

const PORT = process.env.PORT || 3000;

connect().then(() => {
  app.listen(PORT, () => console.log("Desktop API running on", PORT));
});
