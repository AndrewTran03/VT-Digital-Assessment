# BACKEND DOCKERFILE

FROM node:20-alpine

LABEL maintainer="vtdigitalassessment@gmail.com"

ARG BUILD_TYPE=""
ENV BUILD=${BUILD_TYPE}

RUN if [ -z "${BUILD}" ]; then \
    echo "Please provide a build argument!" \
    && echo "Exiting now..." \
    && exit 1; \
fi

WORKDIR /server

# Set non-interactive environment variable
ENV DEBIAN_FRONTEND=noninteractive

# Install all necessary dependencies from Alpine Linux
RUN apk update && \
    apk add --no-cache vim bash npm make git openjdk11 build-base python3

# Install NPM dependencies
COPY package.json .
RUN npm install

# Add backend source code
COPY . .
RUN echo "Build type is ${BUILD}"
# Move correct "config" file into the correct container
# Integrate "production" .env file into deployment ecosystem in the backend
RUN if [ "${BUILD}" == "development" ]; then \
    rm config/production.ts config/staging.ts \
    && mv .env .env.development \
    && echo "Build type is ${BUILD_TYPE}"; \
elif [ "${BUILD}" == "production" ]; then \
    rm config/development.ts config/staging.ts \
    && echo "Build type is ${BUILD}"; \
elif [ "${BUILD}" == "staging" ]; then \
   rm config/development.ts config/production.ts \
    && mv .env.production .env.staging \
    && echo "Build type is ${BUILD}"; \
else \
    echo "Error: Build type is ${BUILD_TYPE} which is NOT VALID!"; \
fi

# Expose backend Node/Express.js app on port
EXPOSE 3001
# Build the "production" version of the backend app
RUN npm run build
# Grant execute permission to the "run_backend.sh" script
RUN chmod +x ./run_backend.sh
# Run the backend app
CMD [ "sh", "-c", "./run_backend.sh ${BUILD}" ]
