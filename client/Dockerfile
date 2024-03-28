# FRONTEND DOCKERFILE

FROM node:20-alpine

LABEL maintainer="vtdigitalassessment@gmail.com"

WORKDIR /client

# Install dependencies
COPY package.json .
RUN npm install --legacy-peer-deps

# Add frontend source code
COPY . .

# Expose frontend React app on port
EXPOSE 5001
# Build the "production" version of the frontend app
RUN npm run build
# Run the frontend app
CMD ["npm", "run", "preview", "--", "--host"]
