# Frontend Dockerfile - Multi-stage build

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments
ARG VITE_BACKEND_API_URL
ARG VITE_MAYAN_API_URL
ARG VITE_KEYCLOAK_URL

# Set environment variables for build
ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL
ENV VITE_MAYAN_API_URL=$VITE_MAYAN_API_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL

# Build production bundle
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
