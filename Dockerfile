FROM node:22.23.4-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /data && chown node:node /app /data
USER node
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
ENV DATABASE_URL=file:/data/leadmind.db
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "npm run setup && npm start"]
