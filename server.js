require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;
const LANG = process.env.LANG || "en";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/weather", async (req, res) => {
  const { lat, lon, lang } = req.query;
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${
        process.env.OPENWEATHER_API_KEY
      }&units=metric&lang=${lang || process.env.LANG}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/forecast", async (req, res) => {
  const { lat, lon, lang } = req.query;
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${
        process.env.OPENWEATHER_API_KEY
      }&units=metric&lang=${lang || process.env.LANG}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/city-name", async (req, res) => {
  const { lat, lon, lang } = req.query;
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${
        lang || "en"
      }`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
