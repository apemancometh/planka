FROM ghcr.io/plankanban/planka:latest
USER root

# Put cert into the image without curl/wget
RUN mkdir -p /app/certs
ADD https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/certs/rds-global-bundle.pem
RUN chmod 0644 /app/certs/rds-global-bundle.pem

# Tell Node/pg to trust it
ENV NODE_EXTRA_CA_CERTS=/app/certs/rds-global-bundle.pem \
    PGSSLROOTCERT=/app/certs/rds-global-bundle.pem \
    PGSSLMODE=require \
    NODE_ENV=production

USER node
