# Weather App

A minimalistic weather application with map integration and multilingual support.

**Live Site:** [https://weather.aryeh.site/](https://weather.aryeh.site/)

## Features

- Interactive map interface with OpenStreetMap integration
- Real-time weather data with concurrent API calls for current weather, forecast, and location data
- 5-hour forecast with hourly updates
- URL synchronization with map position and zoom level for easy sharing and refreshing
- Live location detection with browser geolocation
- Full bilingual support (English and Hebrew) with automatic RTL layout
- Responsive design that works on all devices
- Minimizable weather info popup
- Persistent state through URL parameters
- Progressive Web App (PWA) support - can be installed on devices and works offline
- Automatic version tracking with auto-refresh on updates
- Test commit for version tracking

## Version Tracking

The application includes automatic version tracking and auto-refresh functionality:

1. Version information is stored in `version.json`
2. The version is automatically incremented on each commit using a Git pre-commit hook
3. The current version is displayed in the UI next to the "Find My Location" button
4. The application checks for version updates every 10 seconds
5. If a new version is detected, the page automatically refreshes

### Setting Up Version Tracking

1. Create the pre-commit hook:

```bash
# Create the pre-commit hook file
cat > .git/hooks/pre-commit << 'EOL'
#!/bin/sh

# Read current version
CURRENT_VERSION=$(node -p "require('./version.json').version")

# Increment patch version
NEW_VERSION=$(node -p "
  const [major, minor, patch] = '$CURRENT_VERSION'.split('.').map(Number);
  [major, minor, patch + 1].join('.')
")

# Update version.json
node -p "
  const fs = require('fs');
  const version = '$NEW_VERSION';
  fs.writeFileSync('./version.json', JSON.stringify({ version }, null, 2));
"

# Add version.json to the commit
git add version.json
EOL

# Make the hook executable
chmod +x .git/hooks/pre-commit
```

2. Create the initial version.json file:

```bash
echo '{"version": "1.0.0"}' > version.json
```

3. Add version.json to git:

```bash
git add version.json
git commit -m "chore: add version tracking"
```

## Local Development Setup

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

3. Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Docker Setup (Linux)

The following instructions are for setting up Docker on Linux, which is required for deployment:

```bash
# Update package list
sudo apt-get update

# Install required packages
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    build-essential

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to the docker group
sudo usermod -aG docker $USER
```

Note:

- You'll need to log out and back in for the group changes to take effect
- These instructions are specifically for setting up Docker on Linux systems
- For development on other platforms, Docker Desktop is recommended

## Docker Deployment

### Using Docker Compose (Recommended)

1. Clone the repository:

```bash
git clone <repository-url>
cd weather
```

2. Create a `.env` file with your OpenWeather API key:

```bash
echo "OPENWEATHER_API_KEY=your_api_key_here" > .env
```

3. Start the application:

```bash
docker-compose up -d
```

4. To stop the application:

```bash
docker-compose down
```

### Using Docker Directly

1. Build the Docker image:

```bash
docker build -t weather-app .
```

2. Run the container:

```bash
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
- Docker Compose automatically mounts the current directory as a volume, allowing for live code changes without rebuilding the container.

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

## Credits

<a href="https://www.flaticon.com/free-icons/weather" title="weather icons">Weather icons created by iconixar - Flaticon</a>
