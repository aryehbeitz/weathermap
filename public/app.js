// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("ServiceWorker registration successful");
      })
      .catch((err) => {
        console.log("ServiceWorker registration failed: ", err);
      });
  });
}

let map;
let marker;
const weatherInfo = document.getElementById("weather-info");
let currentLang =
  new URLSearchParams(window.location.search).get("lang") || "en";
let currentVersion = null;

// Version checking function
async function checkVersion() {
  try {
    const response = await fetch("/version.json");
    const data = await response.json();

    // Update version display
    const versionElement = document.getElementById("version");
    if (versionElement) {
      versionElement.textContent = `v${data.version}`;
    }

    // Check if version has changed
    if (currentVersion && currentVersion !== data.version) {
      window.location.reload(true); // Hard refresh
    }

    currentVersion = data.version;
  } catch (error) {
    console.error("Error checking version:", error);
  }
}

// Check version every 10 seconds
setInterval(checkVersion, 10000);

// Initial version check
checkVersion();

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
    const [currentResponse, forecastResponse, cityNameResponse] =
      await Promise.all([
        fetch(`/api/weather?lat=${lat}&lon=${lng}&lang=${currentLang}`),
        fetch(`/api/forecast?lat=${lat}&lon=${lng}&lang=${currentLang}`),
        fetch(`/api/city-name?lat=${lat}&lon=${lng}&lang=${currentLang}`),
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
    console.error("Error fetching weather data:", error);
  }
}

// Function to get location by IP
async function getLocationByIP() {
  try {
    const response = await fetch("/api/ip-location");
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error("Error getting IP location:", error);
    throw error;
  }
}

// Initialize the map when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  const findLocationBtn = document.getElementById("find-location");
  if (findLocationBtn) {
    findLocationBtn.textContent = translations[currentLang].findLocation;
    findLocationBtn.onclick = async () => {
      if (navigator.geolocation) {
        findLocationBtn.disabled = true;
        findLocationBtn.textContent =
          translations[currentLang].findLocation + "...";

        // Set a timeout for geolocation
        const timeoutId = setTimeout(() => {
          findLocationBtn.disabled = false;
          findLocationBtn.textContent = translations[currentLang].findLocation;
          alert(
            translations[currentLang].locationTimeout ||
              "Location request timed out. Please try again."
          );
        }, 10000); // 10 second timeout

        // Try to get location with high accuracy first
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 12);
            if (marker) {
              map.removeLayer(marker);
            }
            marker = L.marker([lat, lng]).addTo(map);
            fetchWeather(lat, lng);
            findLocationBtn.disabled = false;
            findLocationBtn.textContent =
              translations[currentLang].findLocation;
          },
          async (error) => {
            clearTimeout(timeoutId);
            findLocationBtn.disabled = false;
            findLocationBtn.textContent =
              translations[currentLang].findLocation;

            let errorMessage;
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage =
                  translations[currentLang].locationDenied ||
                  "Location access was denied. Please enable location services and try again.";
                break;
              case error.POSITION_UNAVAILABLE:
                // Check if it's a kCLErrorLocationUnknown error
                if (
                  error.message &&
                  error.message.includes("kCLErrorLocationUnknown")
                ) {
                  try {
                    // Try IP-based location as fallback
                    const ipLocation = await getLocationByIP();
                    map.setView([ipLocation.lat, ipLocation.lng], 12);
                    if (marker) {
                      map.removeLayer(marker);
                    }
                    marker = L.marker([ipLocation.lat, ipLocation.lng]).addTo(
                      map
                    );
                    fetchWeather(ipLocation.lat, ipLocation.lng);

                    // Show message about using IP location
                    alert(
                      translations[currentLang].usingIPLocation ||
                        `Using approximate location based on your IP address (${ipLocation.city}, ${ipLocation.country}). For more accurate results, please enable location services.`
                    );
                    return;
                  } catch (ipError) {
                    errorMessage =
                      translations[currentLang].locationUnknown ||
                      "Unable to determine your location. Please try again in a few moments or move to an area with better GPS signal.";
                  }
                } else {
                  errorMessage =
                    translations[currentLang].locationUnavailable ||
                    "Location information is unavailable. Please try again.";
                }
                break;
              case error.TIMEOUT:
                errorMessage =
                  translations[currentLang].locationTimeout ||
                  "Location request timed out. Please try again.";
                break;
              default:
                errorMessage =
                  translations[currentLang].locationError ||
                  "An unknown error occurred while getting your location. Please try again.";
            }
            alert(errorMessage);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        alert(
          translations[currentLang].geolocationNotSupported ||
            "Geolocation is not supported by your browser."
        );
      }
    };
  }

  // Update Find Location button text on language toggle
  const toggleButton = document.querySelector("#language-toggle button");
  if (toggleButton) {
    const originalToggle = toggleButton.onclick;
    toggleButton.onclick = function () {
      originalToggle && originalToggle();
      if (findLocationBtn) {
        findLocationBtn.textContent = translations[currentLang].findLocation;
      }
    };
  }
});
