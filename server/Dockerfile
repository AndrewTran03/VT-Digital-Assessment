# BACKEND DOCKERFILE

FROM node:20-alpine

LABEL maintainer="vtdigitalassessment@gmail.com"

WORKDIR /server

# Install dependencies
COPY package.json .
RUN npm install

# Add backend source code
COPY . .
# Expose backend Node/Express.js app on port
EXPOSE 3000
# Build the "production" version of the backend app
RUN npm run build
# Run the backend app
CMD ["npm", "run", "production"]
