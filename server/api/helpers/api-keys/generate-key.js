/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const crypto = require('crypto');

module.exports = {
  inputs: {
    userId: {
      type: 'string',
      required: true,
      description: 'ID of the user this key belongs to',
    },
    name: {
      type: 'string',
      required: true,
      description: 'Friendly name for the key',
    },
    description: {
      type: 'string',
      allowNull: true,
      description: 'Optional description',
    },
    expiresAt: {
      type: 'ref',
      allowNull: true,
      description: 'Optional expiration date',
    },
    permissions: {
      type: 'json',
      defaultsTo: {},
      description: 'Permissions object',
    },
  },

  async fn(inputs) {
    // Generate a random API key (32 bytes = 64 hex characters)
    const rawKey = crypto.randomBytes(32).toString('hex');

    // Create the key with "plk_" prefix for easy identification
    const apiKey = `plk_${rawKey}`;

    // Hash the key for storage
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Create the database record
    const record = await ApiKey.create({
      key: hashedKey,
      userId: inputs.userId,
      name: inputs.name,
      description: inputs.description,
      expiresAt: inputs.expiresAt,
      permissions: inputs.permissions,
      isActive: true,
    }).fetch();

    // Return both the raw key (only time it's shown) and the record
    return {
      apiKey, // The actual key to give to the user (never stored)
      record, // The database record (with hashed key)
    };
  },
};
