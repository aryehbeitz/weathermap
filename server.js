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
  try {
    const { lat, lon, lang } = req.query;
    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=${
        lang || LANG
      }`
    );

    res.json(response.data);
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
