# Production-ready, versioned Node.js Alpine base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (including devDependencies required for migration/tests)
RUN npm ci

# Copy application source code
COPY . .

# Expose HTTP port
EXPOSE 3000

# Set non-root user
USER node

# Default command: run migrations, seed data, and start server
CMD ["sh", "-c", "node scripts/migrate.js && node scripts/seed.js && node src/server.js"]
