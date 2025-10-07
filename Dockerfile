# syntax=docker/dockerfile:1.4

# ---------- Build-time args (Copilot passes these) ----------
     ARG NODE_IMAGE=public.ecr.aws/docker/library/node:20-bullseye-slim
     ARG RDS_REGION=ap-southeast-2
     ARG WITH_CLIENT=true
     ARG PRUNE_SERVER_DEPS=true

     # ---------- Build stage ----------
     FROM ${NODE_IMAGE} AS build
     WORKDIR /app

     # Toolchain for native modules + Python venv for server postinstall
     RUN apt-get update \
      && apt-get install -y --no-install-recommends python3 python3-venv make g++ \
      && ln -sf /usr/bin/python3 /usr/local/bin/python \
      && rm -rf /var/lib/apt/lists/*

     ENV PYTHON=/usr/bin/python3 \
         npm_config_python=/usr/bin/python3 \
         PIP_NO_CACHE_DIR=1

     # Copy lockfiles first so postinstall runs against them
     COPY package*.json ./
     COPY server/package*.json server/
     COPY client/package*.json client/
     COPY server/requirements.txt server/requirements.txt

     # Root postinstall installs server & client deps
     RUN npm ci

     # Optional client build controlled by arg
     ARG WITH_CLIENT
     RUN if [ "$WITH_CLIENT" = "true" ]; then npm run build --prefix client; fi

     # Bring in the rest of the source
     COPY . .

     # ---------- Runtime stage ----------
     FROM ${NODE_IMAGE} AS runtime
     WORKDIR /app

     # RDS CA bundle (region comes from build arg)
     ARG RDS_REGION
     RUN install -d -m 0755 /app/certs \
      && apt-get update \
      && apt-get install -y --no-install-recommends ca-certificates curl \
      && rm -rf /var/lib/apt/lists/* \
      && curl -fsSL "https://truststore.pki.rds.amazonaws.com/${RDS_REGION}/${RDS_REGION}-bundle.pem" \
           -o /app/certs/rds-bundle.pem \
      && chmod 0644 /app/certs/rds-bundle.pem

     # Copy app from build stage
     COPY --from=build /app /app

     ENV NODE_ENV=production
<<<<<<< HEAD
     # Start the API
     CMD ["npm", "run", "start:prod", "--prefix", "server"]
=======

     # Trim dev deps from server without running scripts (prevents node-gyp)
     ARG PRUNE_SERVER_DEPS
     RUN if [ "$PRUNE_SERVER_DEPS" = "true" ]; then \
           npm --prefix server prune --omit=dev --ignore-scripts && npm cache clean --force ; \
         fi

     # Non-root
     RUN chown -R node:node /app
     USER node

     # Ports & start
     EXPOSE 1337
     CMD ["npm", "start", "--prefix", "server"]
>>>>>>> parent of fa93c71f (Update Dockerfile)
