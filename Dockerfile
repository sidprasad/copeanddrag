# Stage 1: Build
FROM node:16-slim AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

## Need to have ncc installed globally
RUN npm install -g @vercel/ncc

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run
FROM mcr.microsoft.com/playwright:v1.52.0-noble

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage_
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Install only production dependencies
#RUN npm install --only=production
RUN npm install iconv-lite

#https://playwright.dev/docs/docker

# Copy benchmarking scripts
COPY benchmarking ./benchmarking

# Copy the entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/

# Make the entrypoint script executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]