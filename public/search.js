class CitySearch {
  constructor() {
    this.searchInput = document.querySelector(".search-input");
    this.resultsContainer = document.querySelector(".autocomplete-results");
    this.cities = [];
    this.selectedIndex = -1;
    this.debounceTimeout = null;

    this.init();
  }

  async init() {
    await this.loadCities();
    this.setupEventListeners();
  }

  async loadCities() {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/cities.json"
      );
      const data = await response.json();
      this.cities = data.map((city) => ({
        name: city.name,
        country: city.country_name,
        state: city.state_name,
        lat: city.latitude,
        lng: city.longitude,
      }));
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  }

  setupEventListeners() {
    this.searchInput.addEventListener("input", () => {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => this.handleSearch(), 300);
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
  }

  handleSearch() {
    const query = this.searchInput.value.trim();
    if (query.length < 2) {
      this.hideResults();
      return;
    }

    const results = this.fuzzySearch(query);
    this.displayResults(results);
  }

  fuzzySearch(query) {
    const searchTerm = query.toLowerCase();
    return this.cities
      .filter((city) => {
        const cityName = city.name.toLowerCase();
        const countryName = city.country.toLowerCase();
        return (
          cityName.includes(searchTerm) || countryName.includes(searchTerm)
        );
      })
      .slice(0, 10);
  }

  displayResults(results) {
    this.resultsContainer.innerHTML = "";
    this.selectedIndex = -1;

    if (results.length === 0) {
      this.hideResults();
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
      const city = this.cities.find(
        (c) =>
          `${c.name}, ${c.state ? c.state + ", " : ""}${c.country}` ===
          items[this.selectedIndex].textContent
      );
      if (city) {
        this.selectCity(city);
      }
    }
  }

  selectCity(city) {
    this.searchInput.value = `${city.name}, ${
      city.state ? city.state + ", " : ""
    }${city.country}`;
    this.hideResults();

    // Dispatch a custom event that the main app can listen for
    const event = new CustomEvent("citySelected", {
      detail: { lat: city.lat, lng: city.lng },
    });
    document.dispatchEvent(event);
  }

  hideResults() {
    this.resultsContainer.style.display = "none";
    this.selectedIndex = -1;
  }
}

// Initialize the search functionality
document.addEventListener("DOMContentLoaded", () => {
  new CitySearch();
});
