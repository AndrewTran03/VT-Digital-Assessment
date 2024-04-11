# FRONTEND DOCKERFILE

FROM node:20-alpine

LABEL maintainer="vtdigitalassessment@gmail.com"

WORKDIR /client

# Set non-interactive environment variable
ENV DEBIAN_FRONTEND=noninteractive

# Install all necessary dependencies from Alpine Linux
RUN apk update && \
    apk add --no-cache vim npm make git openjdk11 build-base python3

# Install NPM dependencies
COPY package.json .
RUN npm install --legacy-peer-deps

# Add frontend source code
COPY . .

# Expose frontend React app on port
EXPOSE 5001
# Build the "production" version of the frontend app
RUN npm run build
# Run the frontend app
# CMD ["npm", "run", "preview", "--", "--host"]
CMD ["sh", "./run_frontend.sh", "production"]
