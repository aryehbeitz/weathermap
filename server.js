require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Prevent caching for all API responses
app.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store"
  });
  next();
});

// Serve static files with cache control
app.use(express.static("public", {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  }
}));

// Serve version.json with no caching (explicitly set in case middleware changes)
app.get("/version.json", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "version.json"));
});

// Helper function to add cache-busting parameter
const getWithCacheBust = async (url) => {
  const separator = url.includes("?") ? "&" : "?";
  const timestamp = new Date().getTime();
  return axios.get(`${url}${separator}_=${timestamp}`, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
};

// IP-based geolocation endpoint
app.get("/api/ip-location", async (req, res) => {
  try {
    const response = await getWithCacheBust("https://ipapi.co/json/");
    res.json({
      lat: response.data.latitude,
      lng: response.data.longitude,
      city: response.data.city,
      country: response.data.country_name,
      source: "ip",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/weather", async (req, res) => {
  const { lat, lon, lang } = req.query;
  try {
    const response = await getWithCacheBust(
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
    const response = await getWithCacheBust(
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
    const response = await getWithCacheBust(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${
        lang || "en"
      }`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
