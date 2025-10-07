# ---------- Stage 1: build from source ----------
  FROM node:18-bullseye-slim AS build
  WORKDIR /app

  # Native build deps (sharp, etc.)
  RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 build-essential ca-certificates curl \
   && rm -rf /var/lib/apt/lists/*

  # Install deps using lockfile, then bring in source and build
  COPY package*.json ./
  RUN npm ci

  # Copy the whole repo (client/, server/, etc.)
  COPY . .

  # Build the app (Planka’s root package.json provides this)
  # If your fork uses workspaces and this fails, try:
  #   npm --workspace client ci && npm --workspace client run build
  RUN npm run build

  # Remove dev deps for a slim runtime
  RUN npm prune --omit=dev


 # ---------- Stage 2: runtime ----------
FROM node:18-bullseye-slim AS runtime
WORKDIR /app

# Ensure we're root while preparing certs
USER root

# Create certs dir and fetch the RDS regional CA bundle; make it world-readable
RUN install -d -m 0755 /app/certs \
 && apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem \
      -o /app/certs/rds-bundle.pem \
 && chmod 0644 /app/certs/rds-bundle.pem

# Bring in the built app and production deps from the build stage
COPY --from=build /app /app

# Cert-related env so Node/pg trust your RDS TLS chain
ENV NODE_ENV=production \
    PGSSLMODE=require \
    PGSSLROOTCERT=/app/certs/rds-bundle.pem \
    NODE_EXTRA_CA_CERTS=/app/certs/rds-bundle.pem \
    KNEX_REJECT_UNAUTHORIZED_SSL_CERTIFICATE=false

EXPOSE 1337
CMD ["npm", "run", "start"]
