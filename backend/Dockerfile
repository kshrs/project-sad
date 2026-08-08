# Node.js Image
FROM node:24-alpine

# Setup of working directory
WORKDIR /app

# Copy the package.json file of the backend into the container and run it.
COPY package*.json ./
RUN npm install

# Copy the backend source code into WORKDIR
COPY . .

# Expose the backend API Port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]

