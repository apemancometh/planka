# Dockerfile (final stage)
FROM ghcr.io/plankanban/planka:latest

# Ensure the path is traversable by the non-root runtime user
USER root
RUN chmod 755 /app && mkdir -p /app/certs && chmod 755 /app/certs

# Add the RDS region CA bundle
ADD https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem /app/certs/rds-bundle.pem

# (if you overlay a custom frontend, keep your COPY lines here)
COPY client/public/favicon.ico /app/public/favicon.ico
