# ---------- Build stage ----------
     FROM public.ecr.aws/docker/library/node:20-bullseye-slim AS build
     WORKDIR /app

     # Toolchain for node-gyp + Python venv (server postinstall)
     RUN apt-get update \
      && apt-get install -y --no-install-recommends python3 python3-venv make g++ \
      && ln -sf /usr/bin/python3 /usr/local/bin/python \
      && rm -rf /var/lib/apt/lists/*

     # Help node-gyp find Python
     ENV PYTHON=/usr/bin/python3
     ENV npm_config_python=/usr/bin/python3
     # Skip husky during Docker builds (no .git available)
     ENV HUSKY=0

     # 1) Copy lockfiles first
     COPY package*.json ./
     COPY server/package*.json server/
     COPY server/requirements.txt server/requirements.txt
     COPY client/package*.json client/

     # 2) Install deps explicitly per package (don't rely on root postinstall)
     RUN npm ci --prefix server
     RUN npm ci --prefix client

     # 3) Bring the rest of the source
     COPY . .

     # 4) (Optional) Build the client bundle
     ARG WITH_CLIENT=true
     RUN if [ "$WITH_CLIENT" = "true" ]; then npm run build --prefix client; fi

     # 5) Prune server deps to production size
     RUN npm ci --prefix server --omit=dev

     # ---------- Runtime stage ----------
     FROM public.ecr.aws/docker/library/node:20-bullseye-slim
     WORKDIR /app

     # Keep your RDS CA bundle
     RUN install -d -m 0755 /app/certs \
      && apt-get update \
      && apt-get install -y --no-install-recommends ca-certificates curl \
      && rm -rf /var/lib/apt/lists/* \
      && curl -fsSL "https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem" \
           -o /app/certs/rds-bundle.pem \
      && chmod 0644 /app/certs/rds-bundle.pem

     # Copy only what we need at runtime
     COPY --from=build /app/server /app/server
     # If you build the client, copy the built assets too
     COPY --from=build /app/client/dist /app/client/dist
     COPY --from=build /app/package*.json /app/

     ENV NODE_ENV=production
     # Start the API
     CMD ["npm", "run", "start:prod", "--prefix", "server"]
