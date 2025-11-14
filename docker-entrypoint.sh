#!/bin/sh
set -eu

# Ensure app dirs and EFS subdirs exist (Copilot mounts EFS at /data)
mkdir -p /app/public /app/private
mkdir -p /data/user-avatars /data/project-background-images /data/attachments

# Idempotent symlinks from app paths to EFS
ln -snf /data/user-avatars              /app/public/user-avatars
ln -snf /data/project-background-images /app/public/project-background-images
ln -snf /data/attachments               /app/private/attachments

exec "$@"