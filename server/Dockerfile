# BACKEND DOCKERFILE

FROM node:20-alpine

LABEL maintainer="vtdigitalassessment@gmail.com"

WORKDIR /server

# Set non-interactive environment variable
ENV DEBIAN_FRONTEND=noninteractive

# Install all necessary dependencies from Alpine Linux
RUN apk update && \
    apk add --no-cache vim npm make git openjdk11 build-base python3

# Install NPM dependencies
COPY package.json .
RUN npm install

# Add backend source code
COPY . .
# Convert "config" file from "development" to "production" mode
RUN mv config/development.ts config/production.ts
# Integrate "production" .env file into deployment ecosystem in the backend
RUN mv .env.production .env

# Expose backend Node/Express.js app on port
EXPOSE 3001
# Build the "production" version of the backend app
RUN npm run build
# Run the backend app
# CMD ["npm", "run", "production"]
CMD ["sh", "./run_backend.sh", "production"]
