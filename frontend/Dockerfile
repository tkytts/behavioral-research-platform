# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Bake relative URLs so the build works behind any hostname (ngrok, localhost, etc.)
ARG REACT_APP_API_URL=/api
ARG REACT_APP_HUB_URL=/api/gamehub
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_HUB_URL=$REACT_APP_HUB_URL
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
