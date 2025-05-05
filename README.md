# Weather App

A minimalistic weather application with map integration and multilingual support.

## Features

- Interactive map interface
- Real-time weather data
- 5-hour forecast
- English and Hebrew language support
- Responsive design
- Loading spinner
- Minimizable weather info popup

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Docker Deployment

### Prerequisites

- Docker installed on your system
- Git (optional, for cloning the repository)

### Building the Docker Image

```bash
# Clone the repository (if you haven't already)
git clone <repository-url>
cd weather

# Build the Docker image
docker build -t weather-app .
```

### Running the Container

```bash
# Run the container on port 3001
docker run -p 3001:3001 weather-app
```

The app will be available at [http://localhost:3001](http://localhost:3001)

### Environment Variables

The following environment variables are required:

- `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key
- `PORT`: Port number (defaults to 3000 in development, 3001 in Docker)

### Notes

- The Dockerfile sets the environment variable `PORT=3001` so the server listens on the correct port.
- If you want to change the port, update the `EXPOSE` and `ENV PORT` lines in the Dockerfile, and adjust the `docker run` command accordingly.
- Make sure to set your OpenWeatherMap API key in the `.env` file before building the Docker image.

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
