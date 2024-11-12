# Use an official Node.js runtime as a parent image
FROM node:16-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY src ./src
COPY views ./views
COPY examples/paper-examples ./examples/paper-examples
COPY tsconfig.json ./

# Install nodemon and ts-node globally
RUN npm install -g nodemon ts-node

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application with nodemon and ts-node
CMD ["nodemon", "--exec", "ts-node", "src/index.ts"]