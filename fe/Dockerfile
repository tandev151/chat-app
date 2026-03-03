FROM node:24.14.0-trixie-slim AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm@latest

RUN pnpm install

COPY . .

RUN pnpm build

FROM node:24.14.0-trixie-slim

WORKDIR /app

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY --from=builder /app/.next ./.next

EXPOSE 3001

CMD ["pnpm", "start"]