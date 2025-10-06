# Dockerfile (final stage)
FROM ghcr.io/plankanban/planka:latest

# Ensure the path is traversable by the non-root runtime user
USER root
RUN chmod 755 /app && mkdir -p /app/certs && chmod 755 /app/certs

# Add the RDS region CA bundle (defaults to 0644, which is fine)
ADD https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem /app/certs/rds-bundle.pem

# (if you overlay a custom frontend, keep your COPY lines here)
# COPY --from=client /src/client/dist /app/public
# COPY --from=client /src/client/dist/index.html /app/views/index.html
COPY client/public/favicon.ico /app/public/favicon.ico
