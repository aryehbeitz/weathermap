# Weather Map Application

A minimalistic weather application that allows users to select locations on an OpenStreetMap and view weather information.

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

   - Copy `example.env` to `.env`:

   ```bash
   cp example.env .env
   ```

   - Edit `.env` file to customize settings:
     - `OPENWEATHER_API_KEY`: Your OpenWeather API key (default provided)
     - `PORT`: Server port (default: 3000)
     - `LANG`: Language for weather descriptions (default: en)

3. Start the server:

```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Features

- Interactive OpenStreetMap using Leaflet
- Click anywhere on the map to get weather information
- Displays:
  - Location name
  - Temperature in Celsius
  - Weather description
  - Humidity percentage
  - Wind speed and direction
- Clean and minimalistic UI

## API Usage

This application uses the OpenWeather Current Weather API:

- Endpoint: `/data/2.5/weather`
- Free tier available
- No subscription required
- Provides current weather data for any location

## Technologies Used

- Backend:
  - Node.js
  - Express
  - Axios for API calls
- Frontend:
  - OpenStreetMap
  - Leaflet.js for map interaction
  - Vanilla JavaScript
