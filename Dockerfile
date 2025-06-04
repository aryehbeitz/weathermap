# Use official Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the app
COPY . .

# Expose port 3001
EXPOSE 3001

# Set environment variable for port
ENV PORT=3001

# Start the app
CMD ["npm", "run", "start"]
