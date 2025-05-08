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
let selectedCityDisplayName = null;

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
      // Clear service worker cache and unregister
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.unregister();
            // Clear all caches
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map((cacheName) => caches.delete(cacheName))
            );
          }
        } catch (error) {
          console.error("Error clearing cache:", error);
        }
      }
      // Try to reload, but if it fails, show a message and retry after delay
      try {
        window.location.reload(true); // Hard refresh
      } catch (e) {
        showNotification(
          "Update available soon, please try again in a moment."
        );
        setTimeout(() => checkVersion(), 10000);
      }
      return;
    }

    currentVersion = data.version;
  } catch (error) {
    console.error("Error checking version:", error);
    showNotification("Update check failed, retrying soon...");
    setTimeout(() => checkVersion(), 10000);
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
  // Save params to localStorage
  localStorage.setItem("weather_url_params", url.search);
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
  const initialLat = urlParams.has("lat")
    ? parseFloat(urlParams.get("lat"))
    : null;
  const initialLng = urlParams.has("lng")
    ? parseFloat(urlParams.get("lng"))
    : null;
  const initialZoom = parseInt(urlParams.get("zoom")) || 2;

  // Set initial language and RTL
  document.body.dir = currentLang === "he" ? "rtl" : "ltr";

  // Set initial view - either from URL or default to a world view
  const initialView =
    initialLat !== null && initialLng !== null
      ? [initialLat, initialLng]
      : [0, 0];

  map = L.map("map", { worldCopyJump: true }).setView(initialView, initialZoom);

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
    let lat = e.latlng.lat;
    let lng = e.latlng.lng;

    // Clamp latitude and longitude to valid ranges
    lat = Math.max(-90, Math.min(90, lat));
    lng = Math.max(-180, Math.min(180, lng));

    if (marker) {
      map.removeLayer(marker);
    }

    marker = L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], map.getZoom());
    fetchWeather(lat, lng);
    // Update URL and save params after click
    updateURL(lat, lng, map.getZoom());
    // Notify search bar to show toggle
    document.dispatchEvent(new CustomEvent("locationSelected"));
  });

  // If URL has coordinates, fetch weather for that location
  if (initialLat !== null && initialLng !== null) {
    marker = L.marker([initialLat, initialLng]).addTo(map);
    fetchWeather(initialLat, initialLng);
    document.dispatchEvent(new CustomEvent("locationSelected"));
  }
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
      selectedCityDisplayName ||
      cityData.address?.city ||
      cityData.address?.town ||
      cityData.address?.village ||
      currentData.name;

    // Convert m/s to km/h (1 m/s = 3.6 km/h)
    const windSpeedKmh = Math.round(currentData.wind.speed * 3.6);
    const windGustsKmh = currentData.wind.gust
      ? `, ${translations[currentLang].gustsUpTo} ${Math.round(
          currentData.wind.gust * 3.6
        )} ${translations[currentLang].kmh}`
      : "";
    const windDirection = getWindDirection(currentData.wind.deg);

    // Process forecast data
    const forecastList = forecastData.list;
    const forecastItems = forecastList
      .slice(0, 5)
      .map((item) => {
        const date = new Date(item.dt * 1000);
        const time = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const tempMin = Math.round(item.main.temp_min);
        const tempMax = Math.round(item.main.temp_max);
        const temp = Math.round(item.main.temp);
        let tempDisplay =
          tempMin === tempMax
            ? `${temp}${translations[currentLang].celsius}`
            : `${tempMin}${translations[currentLang].celsius} – ${tempMax}${translations[currentLang].celsius}`;
        const windSpeed = Math.round(item.wind.speed * 3.6);
        const windDir = getWindDirection(item.wind.deg);
        return `
        <div class="forecast-item">
          <div class="forecast-time">${time}</div>
          <div class="forecast-temp">${tempDisplay}</div>
          <div class="forecast-wind">${windSpeed} ${translations[currentLang].kmh} ${windDir}</div>
        </div>
      `;
      })
      .join("");

    // --- Daily forecast section ---
    // Group by day
    const dailyMap = {};
    forecastList.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = [];
      }
      dailyMap[dayKey].push(item);
    });
    const dailyKeys = Object.keys(dailyMap);
    const dailyItems = dailyKeys
      .map((dayKey) => {
        const items = dailyMap[dayKey];
        const temps = items
          .map((i) => [
            Math.round(i.main.temp_min),
            Math.round(i.main.temp_max),
          ])
          .flat();
        const min = Math.min(...temps);
        const max = Math.max(...temps);
        // Most common weather description
        const descCounts = {};
        items.forEach((i) => {
          const desc = i.weather[0].description;
          descCounts[desc] = (descCounts[desc] || 0) + 1;
        });
        const summary = Object.entries(descCounts).sort(
          (a, b) => b[1] - a[1]
        )[0][0];
        // Day name
        const dayName = new Date(dayKey).toLocaleDateString(currentLang, {
          weekday: "short",
        });
        // Average wind speed (km/h)
        const avgWind = Math.round(
          items.reduce((sum, i) => sum + i.wind.speed * 3.6, 0) / items.length
        );
        return `
        <div class="forecast-item daily-item">
          <div class="forecast-time">${dayName}</div>
          <div class="forecast-temp">${min}${translations[currentLang].celsius} – ${max}${translations[currentLang].celsius}</div>
          <div class="forecast-wind">${summary}</div>
          <div class="forecast-wind-speed">${avgWind} ${translations[currentLang].kmh}</div>
        </div>
      `;
      })
      .join("");
    const dailySectionTitle = translations[currentLang].dailyForecast.replace(
      "{days}",
      dailyKeys.length
    );

    // Ensure weather info is visible
    weatherInfo.style.display = "block";
    window.weatherInfoHidden = false;

    weatherInfo.innerHTML = `
      <div class="content">
        <div class="current-weather">
          <h3>${cityName}</h3>
          <p>${translations[currentLang].temperature}: ${Math.round(
      currentData.main.temp
    )}${translations[currentLang].celsius}</p>
          <p>${translations[currentLang].weather}: ${
      currentData.weather[0].description
    }</p>
          <p>${translations[currentLang].humidity}: ${
      currentData.main.humidity
    }${translations[currentLang].percent}</p>
          <p>${translations[currentLang].wind}: ${windSpeedKmh} ${
      translations[currentLang].kmh
    }, ${
      translations[currentLang].blowingFrom
    } ${windDirection}${windGustsKmh}</p>
        </div>
        <div class="forecast-container">
          <h4>${translations[currentLang].forecast}</h4>
          <div class="forecast-items">
            <div class="forecast-item" style="font-weight:bold;">
              <div class="forecast-time">${translations[currentLang].time}</div>
              <div class="forecast-temp">${
                translations[currentLang].tempRange
              }</div>
              <div class="forecast-wind">${translations[currentLang].wind}</div>
            </div>
            ${forecastItems}
          </div>
        </div>
        <div class="forecast-container">
          <h4>${dailySectionTitle}</h4>
          <div class="forecast-items daily-forecast-items">
            <div class="forecast-item daily-item" style="font-weight:bold;">
              <div class="forecast-time">${translations[currentLang].day}</div>
              <div class="forecast-temp">${translations[currentLang].min} – ${
      translations[currentLang].max
    }</div>
              <div class="forecast-wind">${
                translations[currentLang].summary
              }</div>
              <div class="forecast-wind-speed">${
                translations[currentLang].windSpeed
              }</div>
            </div>
            ${dailyItems}
          </div>
        </div>
      </div>
    `;

    // Update info toggle button
    const infoToggleBtn = document.querySelector(".info-toggle");
    if (infoToggleBtn) {
      infoToggleBtn.textContent = "👁️";
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

// Function to get location by IP
async function getLocationByIP() {
  try {
    const response = await fetch("/api/ip-location");
    if (!response.ok) {
      throw new Error("Failed to fetch IP location");
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return {
      lat: data.lat,
      lng: data.lng,
      city: data.city,
      country: data.country,
    };
  } catch (error) {
    console.error("Error getting IP location:", error);
    throw error;
  }
}

// Initialize the map when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // If no search params, try to load from localStorage
  if (!window.location.search || window.location.search === "") {
    const savedParams = localStorage.getItem("weather_url_params");
    if (savedParams) {
      window.location.search = savedParams;
      return;
    }
  }
  initMap();

  // Set search bar placeholder based on language
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
    searchInput.placeholder = translations[currentLang].searchPlaceholder;
  }

  // Listen for city selection from search
  document.addEventListener("citySelected", (event) => {
    const { lat, lng, displayName } = event.detail;
    selectedCityDisplayName = displayName || null;
    map.setView([lat, lng], 12);
    if (marker) {
      map.removeLayer(marker);
    }
    marker = L.marker([lat, lng]).addTo(map);
    fetchWeather(lat, lng);
  });

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
          showNotification(translations[currentLang].locationTimeout);
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
            updateURL(lat, lng, map.getZoom());
            findLocationBtn.disabled = false;
            findLocationBtn.textContent =
              translations[currentLang].findLocation;
            // Notify search bar to show toggle
            document.dispatchEvent(new CustomEvent("locationSelected"));
          },
          async (error) => {
            clearTimeout(timeoutId);
            findLocationBtn.disabled = false;
            findLocationBtn.textContent =
              translations[currentLang].findLocation;

            let errorMessage;
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = translations[currentLang].locationDenied;
                break;
              case error.POSITION_UNAVAILABLE:
                // Check if it's a kCLErrorLocationUnknown error
                if (
                  error.message &&
                  error.message.includes("Position update is unavailable")
                ) {
                  try {
                    // Try IP-based location as fallback
                    const ipLocation = await getLocationByIP();
                    if (!ipLocation || !ipLocation.lat || !ipLocation.lng) {
                      throw new Error("Invalid IP location data");
                    }

                    map.setView([ipLocation.lat, ipLocation.lng], 12);
                    if (marker) {
                      map.removeLayer(marker);
                    }
                    marker = L.marker([ipLocation.lat, ipLocation.lng]).addTo(
                      map
                    );
                    fetchWeather(ipLocation.lat, ipLocation.lng);

                    // Show notification about using IP location
                    showNotification(translations[currentLang].usingIPLocation);
                    // Notify search bar to show toggle
                    document.dispatchEvent(new CustomEvent("locationSelected"));
                    return;
                  } catch (ipError) {
                    console.error("IP location fallback failed:", ipError);
                    errorMessage = translations[currentLang].locationUnknown;
                  }
                } else {
                  errorMessage = translations[currentLang].locationUnavailable;
                }
                break;
              case error.TIMEOUT:
                errorMessage = translations[currentLang].locationTimeout;
                break;
              default:
                errorMessage = translations[currentLang].locationError;
            }
            showNotification(errorMessage);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        showNotification(translations[currentLang].geolocationNotSupported);
      }
    };
  }

  // Helper function to show notifications
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), 500);
    }, 5000);
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
      // Update search bar placeholder on language toggle
      if (searchInput) {
        searchInput.placeholder = translations[currentLang].searchPlaceholder;
      }
    };
  }

  // Helper functions to show/hide weather info box and sync icon
  function showWeatherInfoBox() {
    const infoBox = document.getElementById("weather-info");
    const infoToggleBtn = document.querySelector(".info-toggle");
    if (infoBox) infoBox.style.display = "block";
    if (infoToggleBtn) infoToggleBtn.textContent = "👁️";
  }
  function hideWeatherInfoBox() {
    const infoBox = document.getElementById("weather-info");
    const infoToggleBtn = document.querySelector(".info-toggle");
    if (infoBox) infoBox.style.display = "none";
    if (infoToggleBtn) infoToggleBtn.textContent = "🙈";
  }

  // Ensure icon is in sync when box is shown programmatically
  document.addEventListener("locationSelected", () => {
    showWeatherInfoBox();
  });

  // Listen for weatherInfoToggled event
  document.addEventListener("weatherInfoToggled", (e) => {
    const infoBox = document.getElementById("weather-info");
    if (e.detail.hidden) {
      hideWeatherInfoBox();
    } else {
      showWeatherInfoBox();
    }
  });

  // Add CSS for smaller font in daily forecast
  const style = document.createElement("style");
  style.textContent = `.daily-forecast-items .daily-item { font-size: 13px; }`;
  document.head.appendChild(style);
});
