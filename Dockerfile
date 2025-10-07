# ---------- Build stage ----------
FROM public.ecr.aws/docker/library/node:20-bullseye-slim AS build
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv make g++ \
 && ln -sf /usr/bin/python3 /usr/local/bin/python \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHON=/usr/bin/python3
ENV npm_config_python=/usr/bin/python3
ENV PIP_NO_CACHE_DIR=1

# Lockfiles first for better caching
COPY package*.json ./
COPY server/package*.json server/
COPY client/package*.json client/
COPY server/requirements.txt server/requirements.txt

# Install deps for root, server, and client
RUN npm ci \
 && npm ci --prefix server \
 && npm ci --prefix client

# Bring in the rest of the source
COPY . .

# Build client bundle
RUN npm run build --prefix client


# --- Runtime stage ---
FROM public.ecr.aws/docker/library/node:20-bullseye-slim
WORKDIR /app

# RDS cert
RUN install -d -m 0755 /app/certs \
 && apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem -o /app/certs/rds-bundle.pem

# Copy build outputs
COPY --from=build /app/server /app/server
COPY --from=build /app/client/dist /app/client/dist
# EITHER keep this (if .dockerignore allows assets)...
# COPY --from=build /app/assets /app/assets
# ...OR copy from context:
COPY --from=build /app/assets /app/assets
COPY --from=build /app/package*.json /app/

ENV NODE_ENV=production
EXPOSE 1337
WORKDIR /app/server
CMD ["npm", "run", "start:prod"]
