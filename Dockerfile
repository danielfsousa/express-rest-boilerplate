FROM node:14 AS base-dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:14 AS base-prod
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM base-dev AS development
CMD ["node", "src/main.js"]

FROM gcr.io/distroless/nodejs:14 AS production
WORKDIR /app
COPY --from=base-prod /app /app
CMD ["src/main.js"]
