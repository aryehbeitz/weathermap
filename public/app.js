let map;
let marker;
const weatherInfo = document.getElementById("weather-info");
let currentLang =
  new URLSearchParams(window.location.search).get("lang") || "en";

function getWindDirection(degrees) {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function updateURL(lat, lng, zoom) {
  const url = new URL(window.location);
  url.searchParams.set("lat", lat.toFixed(6));
  url.searchParams.set("lng", lng.toFixed(6));
  url.searchParams.set("zoom", zoom);
  url.searchParams.set("lang", currentLang);
  window.history.pushState({}, "", url);
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "he" : "en";
  // Set RTL for Hebrew
  document.body.dir = currentLang === "he" ? "rtl" : "ltr";
  // Update the toggle button text
  const toggleButton = document.querySelector("#language-toggle button");
  toggleButton.textContent = translations[currentLang].toggleLanguage;
  // Update URL with new language
  const url = new URL(window.location);
  url.searchParams.set("lang", currentLang);
  window.history.pushState({}, "", url);
  // If there's a marker, refresh the weather data with new language
  if (marker) {
    const latlng = marker.getLatLng();
    fetchWeather(latlng.lat, latlng.lng);
  }
}

function initMap() {
  // Get initial position from URL or use defaults
  const urlParams = new URLSearchParams(window.location.search);
  const initialLat = parseFloat(urlParams.get("lat")) || 0;
  const initialLng = parseFloat(urlParams.get("lng")) || 0;
  const initialZoom = parseInt(urlParams.get("zoom")) || 2;

  // Set initial language and RTL
  document.body.dir = currentLang === "he" ? "rtl" : "ltr";

  map = L.map("map").setView([initialLat, initialLng], initialZoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Initialize language toggle
  const toggleButton = document.querySelector("#language-toggle button");
  toggleButton.textContent = translations[currentLang].toggleLanguage;
  toggleButton.onclick = toggleLanguage;

  // Update URL when map moves
  map.on("moveend", () => {
    const center = map.getCenter();
    updateURL(center.lat, center.lng, map.getZoom());
  });

  map.on("click", (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (marker) {
      map.removeLayer(marker);
    }

    marker = L.marker([lat, lng]).addTo(map);
    fetchWeather(lat, lng);
  });
}

async function fetchWeather(lat, lng) {
  try {
    const response = await fetch(
      `/api/weather?lat=${lat}&lon=${lng}&lang=${
        currentLang === "he" ? "he" : "en"
      }`
    );
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Convert m/s to km/h (1 m/s = 3.6 km/h)
    const windSpeedKmh = (data.wind.speed * 3.6).toFixed(1);
    const windGustsKmh = data.wind.gust
      ? `, ${translations[currentLang].gustsUpTo} ${(
          data.wind.gust * 3.6
        ).toFixed(1)} ${translations[currentLang].kmh}`
      : "";
    const windDirection = getWindDirection(data.wind.deg);

    weatherInfo.style.display = "block";
    weatherInfo.innerHTML = `
            <h3>${data.name}</h3>
            <p>${translations[currentLang].temperature}: ${data.main.temp}${translations[currentLang].celsius}</p>
            <p>${translations[currentLang].weather}: ${data.weather[0].description}</p>
            <p>${translations[currentLang].humidity}: ${data.main.humidity}${translations[currentLang].percent}</p>
            <p>${translations[currentLang].wind}: ${windSpeedKmh} ${translations[currentLang].kmh}, ${translations[currentLang].blowingFrom} ${windDirection}${windGustsKmh}</p>
        `;
  } catch (error) {
    weatherInfo.style.display = "block";
    weatherInfo.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

// Initialize the map when the page loads
document.addEventListener("DOMContentLoaded", initMap);
