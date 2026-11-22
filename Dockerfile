# syntax=docker/dockerfile:1.7

FROM node:26-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
COPY package.json ./
RUN npm install --global "$(node -p 'require("./package.json").packageManager')"

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/email/package.json packages/email/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/jobs/package.json packages/jobs/package.json
COPY packages/runtime/package.json packages/runtime/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS deploy-api
COPY apps/api apps/api
COPY packages packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter @starter/api --prod deploy --legacy /prod/api

FROM deps AS deploy-worker
COPY apps/worker apps/worker
COPY packages packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter @starter/worker --prod deploy --legacy /prod/worker

FROM platformatic/node-caged:26-slim AS api
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
COPY --from=deploy-api --chown=node:node /prod/api /app
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3001/health/live').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "src/index.ts"]

FROM platformatic/node-caged:26-slim AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deploy-worker --chown=node:node /prod/worker /app
USER node
CMD ["node", "src/index.ts"]
