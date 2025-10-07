# ---------- Build stage ----------
     FROM node:20-bullseye-slim AS build
     WORKDIR /app

     # Toolchain for native modules + Python venv for server postinstall
     RUN apt-get update \
      && apt-get install -y --no-install-recommends python3 python3-venv make g++ \
      && ln -sf /usr/bin/python3 /usr/local/bin/python \
      && rm -rf /var/lib/apt/lists/*

     # Help node-gyp find Python (safe with npm v10+)
     ENV PYTHON=/usr/bin/python3
     ENV npm_config_python=/usr/bin/python3
     # Keep pip lean inside the server’s venv created during postinstall
     ENV PIP_NO_CACHE_DIR=1

     # 1) copy lockfiles first so postinstall can run against them
     COPY package*.json ./
     COPY server/package*.json server/
     COPY client/package*.json client/

     # 2) install (root postinstall runs and installs server/client)
     RUN npm ci

     # 3) now bring in the rest of the source
     COPY . .

     # (optional) build client bundle if your app needs it
     # RUN npm run build --prefix client


     # ---------- Runtime stage ----------
     FROM node:20-bullseye-slim
     WORKDIR /app

     # Keep your RDS CA bundle (adjust region if needed)
     RUN install -d -m 0755 /app/certs \
      && apt-get update \
      && apt-get install -y --no-install-recommends ca-certificates curl \
      && rm -rf /var/lib/apt/lists/* \
      && curl -fsSL https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem \
           -o /app/certs/rds-bundle.pem \
      && chmod 0644 /app/certs/rds-bundle.pem

     # Copy build output
     COPY --from=build /app /app

     ENV NODE_ENV=production

     # Trim dev deps from server and clean npm cache for a smaller image
     RUN npm prune --omit=dev --prefix server && npm cache clean --force

     # (optional but recommended) run as non-root
     RUN chown -R node:node /app
     USER node

     # Start the server (adjust if your start script differs)
     CMD ["npm", "start", "--prefix", "server"]
