# Stage 1: Build the application
FROM node:24.14.0-trixie-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest


# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install 

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Build the production image
FROM node:24.14.0-trixie-slim 

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy the built application
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod

# Copy the built application
COPY --from=builder /app/dist ./dist

EXPOSE 3000


# Start the application
CMD ["node", "dist/src/main.js"]