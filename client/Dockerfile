# FRONTEND DOCKERFILE

FROM node:20-alpine

LABEL maintainer="vtdigitalassessment@gmail.com"

ARG BUILD_TYPE=""
ENV BUILD=${BUILD_TYPE}

RUN if [ -z "${BUILD}" ]; then \
    echo "Please provide a build argument!" \
    && echo "Exiting now..." \
    && exit 1; \
fi

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
RUN echo "Build type is ${BUILD_TYPE}"
RUN if [ "${BUILD_TYPE}" == "production" ]; then \
    npm run build-prod \
    && echo "Build type is ${BUILD_TYPE}"; \
elif [ "${BUILD_TYPE}" == "staging" ]; then \
    npm run build-stage \
    && echo "Build type is ${BUILD_TYPE}"; \
else \
    echo "Error: Build type is ${BUILD} which is NOT VALID!"; \
fi
# Grant execute permission to the "run_frontend.sh" script
RUN chmod +x ./run_frontend.sh
# Run the frontend app
CMD [ "sh", "-c", "./run_frontend.sh ${BUILD}" ]
