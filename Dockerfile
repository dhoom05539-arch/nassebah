FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable

# pnpm patchedDependencies must exist before install.
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV JSON_DB_PATH=/data/attendance.json
RUN corepack enable && mkdir -p /data && chown -R node:node /data /app

COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/patches ./patches
# vite.ts is imported by the server entrypoint, so keep devDependencies in runtime.
RUN pnpm install --prod=false --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
