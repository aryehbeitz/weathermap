# Use official Node.js 22 image
FROM node:22

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
