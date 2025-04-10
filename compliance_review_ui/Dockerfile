FROM node:18-alpine as build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies (clean install)
RUN npm ci

# Copy source code (node_modules is excluded via .dockerignore)
COPY . .

# Skip TypeScript checking and just do the Vite build
RUN npx vite build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
