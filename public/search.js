class CitySearch {
  constructor() {
    this.searchInput = document.querySelector(".search-input");
    this.resultsContainer = document.querySelector(".autocomplete-results");
    this.infoToggle = document.querySelector(".info-toggle");
    this.selectedIndex = -1;
    this.debounceTimeout = null;
    this.currentResults = [];
    this.citySelected = false;
    window.weatherInfoHidden = false;

    this.setupEventListeners();
    this.updateToggleVisibility();

    // Listen for citySelected event (e.g., from Find My Location)
    document.addEventListener("citySelected", () => {
      this.citySelected = true;
      this.showDataBox();
      this.updateToggleVisibility();
    });
    // Listen for locationSelected event (map click or location)
    document.addEventListener("locationSelected", () => {
      this.citySelected = true;
      this.showDataBox();
      this.updateToggleVisibility();
    });
  }

  setupEventListeners() {
    this.searchInput.addEventListener("input", () => {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => this.handleSearch(), 300);
      this.citySelected = false;
      this.showDataBox();
      this.updateToggleVisibility();
    });

    this.searchInput.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          this.navigateResults(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          this.navigateResults(-1);
          break;
        case "Enter":
          e.preventDefault();
          this.selectCurrentResult();
          break;
        case "Escape":
          this.hideResults();
          break;
      }
    });

    document.addEventListener("click", (e) => {
      if (
        !this.searchInput.contains(e.target) &&
        !this.resultsContainer.contains(e.target)
      ) {
        this.hideResults();
      }
    });

    if (this.infoToggle) {
      this.infoToggle.addEventListener("click", () => {
        const infoBox = document.getElementById("weather-info");
        if (window.weatherInfoHidden) {
          this.showDataBox();
        } else {
          this.hideDataBox();
        }
        this.updateToggleVisibility();
        document.dispatchEvent(
          new CustomEvent("weatherInfoToggled", {
            detail: { hidden: window.weatherInfoHidden },
          })
        );
      });
    }
  }

  showDataBox() {
    const infoBox = document.getElementById("weather-info");
    if (infoBox) infoBox.style.display = "block";
    window.weatherInfoHidden = false;
  }

  hideDataBox() {
    const infoBox = document.getElementById("weather-info");
    if (infoBox) infoBox.style.display = "none";
    window.weatherInfoHidden = true;
  }

  updateToggleVisibility() {
    if (!this.infoToggle) return;
    const infoBox = document.getElementById("weather-info");
    const isVisible =
      infoBox && window.getComputedStyle(infoBox).display !== "none";
    if (
      this.citySelected ||
      (this.currentResults && this.currentResults.length > 0)
    ) {
      this.infoToggle.style.display = "inline-block";
      this.infoToggle.textContent = isVisible ? "👁️" : "🙈";
    } else {
      this.infoToggle.style.display = "none";
    }
  }

  async handleSearch() {
    const query = this.searchInput.value.trim();
    if (query.length < 2) {
      this.hideResults();
      this.citySelected = false;
      this.showDataBox();
      this.updateToggleVisibility();
      return;
    }

    try {
      const results = await this.searchCities(query);
      this.currentResults = results;
      this.displayResults(results);
      this.citySelected = false;
      this.showDataBox();
      this.updateToggleVisibility();
    } catch (error) {
      console.error("Error searching cities:", error);
      this.hideResults();
      this.citySelected = false;
      this.showDataBox();
      this.updateToggleVisibility();
    }
  }

  async searchCities(query) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=10&type=city`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch cities");
    }

    const data = await response.json();
    return data.map((item) => ({
      name: item.display_name.split(",")[0],
      country: item.display_name.split(",").pop().trim(),
      state:
        item.display_name.split(",").length > 2
          ? item.display_name.split(",")[1].trim()
          : "",
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  }

  displayResults(results) {
    this.resultsContainer.innerHTML = "";
    this.selectedIndex = -1;

    if (results.length === 0) {
      this.hideResults();
      this.updateToggleVisibility();
      return;
    }

    results.forEach((city, index) => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      div.textContent = `${city.name}, ${city.state ? city.state + ", " : ""}${
        city.country
      }`;
      div.addEventListener("click", () => this.selectCity(city));
      this.resultsContainer.appendChild(div);
    });

    this.resultsContainer.style.display = "block";
    this.updateToggleVisibility();
  }

  navigateResults(direction) {
    const items = this.resultsContainer.querySelectorAll(".autocomplete-item");
    if (items.length === 0) return;

    this.selectedIndex =
      (this.selectedIndex + direction + items.length) % items.length;

    items.forEach((item, index) => {
      item.classList.toggle("active", index === this.selectedIndex);
    });

    const selectedItem = items[this.selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }

  selectCurrentResult() {
    const items = this.resultsContainer.querySelectorAll(".autocomplete-item");
    if (this.selectedIndex >= 0 && this.selectedIndex < items.length) {
      const city = this.currentResults[this.selectedIndex];
      if (city) {
        this.selectCity(city);
      }
    }
  }

  selectCity(city) {
    this.searchInput.value = "";
    this.hideResults();
    this.citySelected = true;
    this.showDataBox();
    this.updateToggleVisibility();

    // Dispatch a custom event that the main app can listen for
    const event = new CustomEvent("citySelected", {
      detail: {
        lat: city.lat,
        lng: city.lng,
        displayName: `${city.name}${city.state ? ", " + city.state : ""}, ${
          city.country
        }`,
      },
    });
    document.dispatchEvent(event);
  }

  hideResults() {
    this.resultsContainer.style.display = "none";
    this.selectedIndex = -1;
    this.updateToggleVisibility();
  }
}

// Initialize the search functionality
document.addEventListener("DOMContentLoaded", () => {
  new CitySearch();
});
