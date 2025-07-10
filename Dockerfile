# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]