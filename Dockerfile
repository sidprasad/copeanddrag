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


# Copy only the necessary files from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Install only production dependencies
#RUN npm install --only=production

# # INstall Playwright and its dependencies
# RUN npm install playwright && \
#     npx playwright install --with-deps

COPY benchmarking ./benchmarking


# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/index.js"]