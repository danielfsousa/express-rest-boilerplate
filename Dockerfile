FROM node:14 AS base
WORKDIR /app
COPY package*.json ./
COPY . .

FROM base AS development
RUN npm ci
CMD ["node", "src/main.js"]

FROM base AS build
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs:14 AS production
WORKDIR /app
COPY --from=build /app /app
CMD ["src/main.js"]
