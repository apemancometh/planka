/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /external/api-keys/{keyId}:
 *   delete:
 *     summary: Delete API key
 *     description: Deletes an API key. Uses Bearer token auth.
 *     tags:
 *       - External API
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: keyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key deleted successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: API key not found
 */

const { idInput } = require('../../../../utils/inputs');

const Errors = {
  NOT_AUTHENTICATED: {
    notAuthenticated: 'Authentication required',
  },
  API_KEY_NOT_FOUND: {
    apiKeyNotFound: 'API key not found',
  },
};

module.exports = {
  inputs: {
    keyId: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notAuthenticated: {
      responseType: 'unauthorized',
    },
    apiKeyNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // This endpoint requires regular authentication (not API key)
    if (!currentUser) {
      throw Errors.NOT_AUTHENTICATED;
    }

    const apiKey = await ApiKey.findOne({
      id: inputs.keyId,
      userId: currentUser.id,
      deletedAt: null,
    });

    if (!apiKey) {
      throw Errors.API_KEY_NOT_FOUND;
    }

    // Soft delete
    await ApiKey.updateOne({ id: apiKey.id }).set({
      deletedAt: new Date().toISOString(),
      isActive: false,
    });

    return {
      item: {
        id: apiKey.id,
      },
    };
  },
};
