FROM node:24-bookworm-slim AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ARG NAME_MAX_LENGTH=255
ENV VITE_API_URL=$VITE_API_URL
ENV NAME_MAX_LENGTH=$NAME_MAX_LENGTH

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
