# The app uses native Node modules (sharp and better-sqlite3), so build it in
# the same Linux environment that will run it inside Cloudflare Containers.
FROM node:22-bookworm-slim AS dependencies
WORKDIR /app

# better-sqlite3 and sharp contain native code. Build those modules in the
# Debian build stage, then copy the working runtime modules into the final
# minimal image instead of asking a compiler-less runtime to install them.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS production_dependencies
RUN npm prune --omit=dev

FROM dependencies AS build
COPY . ./
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

COPY package.json package-lock.json ./
COPY --from=production_dependencies /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./next.config.js
COPY --from=build /app/seed ./seed
# The SQLite fallback initializes its schema on first use at runtime.
COPY --from=build /app/scripts/schema.sql ./scripts/schema.sql

EXPOSE 8080
CMD ["./node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "8080"]
