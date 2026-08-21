# Use a slim, versioned base image for smaller size and reproducibility
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy only dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy the rest of the application source
COPY . .

# Document the port the app listens on (informational, not enforced)
EXPOSE 3000

# Run as a non-root user for better container security
USER node

# Start the application
CMD ["node", "src/server.js"]
