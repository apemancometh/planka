# Build stage
FROM node:20-bullseye-slim AS build
WORKDIR /app

# Native module toolchain + Python venv support for server postinstall
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv make g++ \
 && ln -sf /usr/bin/python3 /usr/local/bin/python \
 && rm -rf /var/lib/apt/lists/*

# Help node-gyp find Python (safe with npm v10+)
ENV PYTHON=/usr/bin/python3
ENV npm_config_python=/usr/bin/python3


# 1) copy lockfiles up front so postinstall can find them
COPY package*.json ./
COPY server/package*.json server/
COPY client/package*.json client/

# 2) install (root postinstall will run and install server/client)
RUN npm ci

# 3) now bring the rest of the source in
COPY . .

# (optional) build client if your app expects a prebuilt bundle
# RUN npm run build --prefix client


# Runtime stage (keep your RDS CA bundle)
FROM node:20-bullseye-slim
WORKDIR /app

RUN install -d -m 0755 /app/certs \
 && apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem \
      -o /app/certs/rds-bundle.pem \
 && chmod 0644 /app/certs/rds-bundle.pem

# copy everything built in the first stage
COPY --from=build /app /app

ENV NODE_ENV=production
# adjust to however you start Planka (root or server):
CMD ["npm", "start", "--prefix", "server"]
