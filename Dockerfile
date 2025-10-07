# ---------- Build stage ----------
     FROM public.ecr.aws/docker/library/node:20-bullseye-slim AS build
     WORKDIR /app

     # Toolchain for native modules + Python venv (if server scripts use it)
     RUN apt-get update \
      && apt-get install -y --no-install-recommends python3 python3-venv make g++ \
      && ln -sf /usr/bin/python3 /usr/local/bin/python \
      && rm -rf /var/lib/apt/lists/*

     # Help node-gyp find Python
     ENV PYTHON=/usr/bin/python3
     ENV npm_config_python=/usr/bin/python3
     ENV PIP_NO_CACHE_DIR=1
     ENV npm_config_loglevel=warn

     # Copy lockfiles first for deterministic installs & better caching
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

     # Build the client bundle (so server can serve static assets)
     RUN npm run build --prefix client

     # ---------- Runtime stage ----------
     FROM public.ecr.aws/docker/library/node:20-bullseye-slim
     WORKDIR /app

     # Keep your RDS CA bundle (adjust region if needed)
     RUN install -d -m 0755 /app/certs \
      && apt-get update \
      && apt-get install -y --no-install-recommends ca-certificates curl \
      && rm -rf /var/lib/apt/lists/* \
      && curl -fsSL "https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem" \
           -o /app/certs/rds-bundle.pem \
      && chmod 0644 /app/certs/rds-bundle.pem

     # Copy only what's needed at runtime
     COPY --from=build /app/server /app/server
     COPY --from=build /app/client/dist /app/client/dist
     COPY --from=build /app/assets /app/assets
     COPY --from=build /app/certs /app/certs
     COPY --from=build /app/package*.json /app/

     # (Optional) Some servers expect client/build; provide a symlink to dist
     RUN ln -sfn /app/client/dist /app/client/build || true

     # Production env & logging
     ENV NODE_ENV=production
     ENV PORT=1337
     ENV HOST=0.0.0.0
     ENV npm_config_loglevel=warn

     # Trim dev deps from server and clean npm cache
     RUN npm prune --omit=dev --prefix server \
      && npm ca
