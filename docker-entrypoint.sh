#!/bin/sh
set -eu

# Ensure app and EFS dirs exist
mkdir -p /app/public /app/private /app/server/public
mkdir -p /data/user-avatars /data/project-background-images /data/attachments

# Point BOTH possible public roots to EFS (idempotent)
rm -rf /app/public/user-avatars /app/public/project-background-images /app/private/attachments || true
ln -snf /data/user-avatars              /app/public/user-avatars
ln -snf /data/project-background-images /app/public/project-background-images
ln -snf /data/attachments               /app/private/attachments

rm -rf /app/server/public/user-avatars /app/server/public/project-background-images || true
ln -snf /data/user-avatars              /app/server/public/user-avatars
ln -snf /data/project-background-images /app/server/public/project-background-images

# (optional) relax perms on EFS tree
chmod -R 0775 /data || true

exec "$@"
