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
  const loadingSpinner = document.getElementById("loading-spinner");
  try {
    loadingSpinner.classList.remove("hidden");
    const [currentResponse, forecastResponse, cityNameResponse] =
      await Promise.all([
        fetch(
          `/api/weather?lat=${lat}&lon=${lng}&lang=${
            currentLang === "he" ? "he" : "en"
          }`
        ),
        fetch(
          `/api/forecast?lat=${lat}&lon=${lng}&lang=${
            currentLang === "he" ? "he" : "en"
          }`
        ),
        fetch(
          `/api/city-name?lat=${lat}&lon=${lng}&lang=${
            currentLang === "he" ? "he" : "en"
          }`
        ),
      ]);

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();
    const cityData = await cityNameResponse.json();

    if (currentData.error || forecastData.error || cityData.error) {
      throw new Error(
        currentData.error || forecastData.error || cityData.error
      );
    }

    // Get localized city name
    const cityName =
      cityData.address?.city ||
      cityData.address?.town ||
      cityData.address?.village ||
      currentData.name;

    // Convert m/s to km/h (1 m/s = 3.6 km/h)
    const windSpeedKmh = (currentData.wind.speed * 3.6).toFixed(1);
    const windGustsKmh = currentData.wind.gust
      ? `, ${translations[currentLang].gustsUpTo} ${(
          currentData.wind.gust * 3.6
        ).toFixed(1)} ${translations[currentLang].kmh}`
      : "";
    const windDirection = getWindDirection(currentData.wind.deg);

    // Process forecast data
    const forecastItems = forecastData.list
      .slice(0, 5)
      .map((item) => {
        const date = new Date(item.dt * 1000);
        const time = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const windSpeed = (item.wind.speed * 3.6).toFixed(1);
        const windDir = getWindDirection(item.wind.deg);
        return `
        <div class="forecast-item">
          <div class="forecast-time">${time}</div>
          <div class="forecast-temp">${item.main.temp}${translations[currentLang].celsius}</div>
          <div class="forecast-wind">${windSpeed} ${translations[currentLang].kmh} ${windDir}</div>
        </div>
      `;
      })
      .join("");

    weatherInfo.style.display = "block";
    weatherInfo.innerHTML = `
      <button class="toggle-size" title="${translations[currentLang].toggleSize}">▼</button>
      <div class="content">
        <div class="current-weather">
          <h3>${cityName}</h3>
          <p>${translations[currentLang].temperature}: ${currentData.main.temp}${translations[currentLang].celsius}</p>
          <p>${translations[currentLang].weather}: ${currentData.weather[0].description}</p>
          <p>${translations[currentLang].humidity}: ${currentData.main.humidity}${translations[currentLang].percent}</p>
          <p>${translations[currentLang].wind}: ${windSpeedKmh} ${translations[currentLang].kmh}, ${translations[currentLang].blowingFrom} ${windDirection}${windGustsKmh}</p>
        </div>
        <div class="forecast-container">
          <h4>${translations[currentLang].forecast}</h4>
          <div class="forecast-items">
            ${forecastItems}
          </div>
        </div>
      </div>
    `;

    // Add toggle button functionality
    const toggleButton = weatherInfo.querySelector(".toggle-size");
    toggleButton.addEventListener("click", () => {
      toggleButton.classList.add("spinning");
      setTimeout(() => {
        weatherInfo.classList.toggle("minimized");
        toggleButton.textContent = weatherInfo.classList.contains("minimized")
          ? "▲"
          : "▼";
        toggleButton.classList.remove("spinning");
      }, 300); // Match animation duration
    });
  } catch (error) {
    weatherInfo.style.display = "block";
    weatherInfo.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  } finally {
    loadingSpinner.classList.add("hidden");
  }
}

// Initialize the map when the page loads
document.addEventListener("DOMContentLoaded", initMap);
