# Weather App

A minimalistic weather application with map integration and multilingual support.

**Live Site:** [https://weather.aryeh.site/](https://weather.aryeh.site/)

## Features

- Interactive map interface
- Real-time weather data
- 5-hour forecast
- English and Hebrew language support
- Responsive design
- Loading spinner
- Minimizable weather info popup

## Prerequisites

### Linux Installation

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

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc if using zsh

# Install and use Node.js LTS
nvm install --lts
nvm use --lts

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
- After installing NVM, you may need to restart your terminal or run `source ~/.bashrc` (or `source ~/.zshrc` if using zsh)
- The Node.js version will be automatically managed by NVM based on the project's `.nvmrc` file

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

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

## Credits

<a href="https://www.flaticon.com/free-icons/weather" title="weather icons">Weather icons created by iconixar - Flaticon</a>
