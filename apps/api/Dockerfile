FROM node:24-alpine

RUN corepack enable

WORKDIR /app

# Copy workspace manifests first so `pnpm install` is cached
# independently of application source changes.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/apps/api

EXPOSE 3333

CMD ["node", "ace", "serve", "--hmr"]
