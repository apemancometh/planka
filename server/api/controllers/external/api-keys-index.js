/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /external/api-keys:
 *   get:
 *     summary: List API keys
 *     description: Lists all API keys for the authenticated user. Uses Bearer token auth.
 *     tags:
 *       - External API
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *       401:
 *         description: Not authenticated
 */

const Errors = {
  NOT_AUTHENTICATED: {
    notAuthenticated: 'Authentication required',
  },
};

module.exports = {
  inputs: {},

  exits: {
    notAuthenticated: {
      responseType: 'unauthorized',
    },
  },

  async fn() {
    const { currentUser } = this.req;

    // This endpoint requires regular authentication (not API key)
    if (!currentUser) {
      throw Errors.NOT_AUTHENTICATED;
    }

    const apiKeys = await ApiKey.find({
      userId: currentUser.id,
      deletedAt: null,
    }).sort('createdAt DESC');

    return {
      items: apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        description: key.description,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        permissions: key.permissions,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      })),
    };
  },
};
