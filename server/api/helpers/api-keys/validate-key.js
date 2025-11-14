/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const crypto = require('crypto');

module.exports = {
  inputs: {
    key: {
      type: 'string',
      required: true,
      description: 'The API key to validate',
    },
  },

  async fn(inputs) {
    // Hash the provided key to compare with stored hash
    const hashedKey = crypto.createHash('sha256').update(inputs.key).digest('hex');

    // Find the API key record
    const apiKey = await ApiKey.findOne({
      key: hashedKey,
      isActive: true,
      deletedAt: null,
    });

    if (!apiKey) {
      return null;
    }

    // Check if key has expired
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return null;
    }

    // Update last used timestamp
    await ApiKey.updateOne({ id: apiKey.id }).set({
      lastUsedAt: new Date().toISOString(),
    });

    // Fetch the associated user
    const user = await User.qm.getOneById(apiKey.userId, {
      withDeactivated: false,
    });

    if (!user) {
      return null;
    }

    return {
      apiKey,
      user,
    };
  },
};
