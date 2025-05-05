let map;
let marker;
const weatherInfo = document.getElementById("weather-info");

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

function initMap() {
  map = L.map("map").setView([0, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

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
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lng}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Convert m/s to km/h (1 m/s = 3.6 km/h)
    const windSpeedKmh = (data.wind.speed * 3.6).toFixed(1);
    const windGustsKmh = data.wind.gust
      ? `, gusts up to ${(data.wind.gust * 3.6).toFixed(1)} km/h`
      : "";
    const windDirection = getWindDirection(data.wind.deg);

    weatherInfo.style.display = "block";
    weatherInfo.innerHTML = `
            <h3>${data.name}</h3>
            <p>Temperature: ${data.main.temp}°C</p>
            <p>Weather: ${data.weather[0].description}</p>
            <p>Humidity: ${data.main.humidity}%</p>
            <p>Wind: ${windSpeedKmh} km/h, Blowing from the ${windDirection}${windGustsKmh}</p>
        `;
  } catch (error) {
    weatherInfo.style.display = "block";
    weatherInfo.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

// Initialize the map when the page loads
document.addEventListener("DOMContentLoaded", initMap);
