# BACKEND DOCKERFILE

FROM node:20-alpine

LABEL maintainer="vtdigitalassessment@gmail.com"

ARG BUILD_TYPE=""

RUN if [ -z "${BUILD_TYPE}" ]; then \
    echo "Please provide a build argument!" \
    && echo "Exiting now..." \
    && exit 1; \
fi

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
# Convert "config" file from "development" to "production" mode (if needed)
RUN if [ ${BUILD_TYPE} == "development" ]; then \
    mv config/development.ts config/production.ts \
    && echo "Build type is ${BUILD_TYPE}}"; \
elif [ ${BUILD_TYPE} == "production" ]; then \
    rm -f config/development.ts \
    && echo "Build type is ${BUILD_TYPE}}"; \
else \
    echo "Build type is not 'development' but is ${BUILD_TYPE}"; \
fi
# Integrate "production" .env file into deployment ecosystem in the backend
RUN mv .env.production .env

# Expose backend Node/Express.js app on port
EXPOSE 3001
# Build the "production" version of the backend app
RUN npm run build
# Run the backend app
# CMD ["npm", "run", "production"]
CMD ["sh", "./run_backend.sh", "production"]
