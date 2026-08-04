FROM node:24-alpine

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# Copy workspace manifests first so `pnpm install` is cached
# independently of application source changes.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm config set store-dir /pnpm-store --global
RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "exec", "next", "dev"]
