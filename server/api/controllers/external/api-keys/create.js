/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /external/api-keys:
 *   post:
 *     summary: Create API key
 *     description: Creates a new API key for the authenticated user. Note - This endpoint uses Bearer token authentication, not API key.
 *     tags:
 *       - External API
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Friendly name for the key
 *                 example: Voice Assistant Integration
 *               description:
 *                 type: string
 *                 description: Optional description
 *                 example: Used for creating cards from Alexa
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *               permissions:
 *                 type: object
 *                 description: Optional permissions object
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   description: The actual API key (only shown once!)
 *                 item:
 *                   type: object
 *                   description: The API key record
 *       401:
 *         description: Not authenticated
 */

const Errors = {
  NOT_AUTHENTICATED: {
    notAuthenticated: 'Authentication required',
  },
};

module.exports = {
  inputs: {
    name: {
      type: 'string',
      required: true,
      maxLength: 255,
    },
    description: {
      type: 'string',
      maxLength: 1024,
      allowNull: true,
    },
    expiresAt: {
      type: 'ref',
    },
    permissions: {
      type: 'json',
      defaultsTo: {},
    },
  },

  exits: {
    notAuthenticated: {
      responseType: 'unauthorized',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // This endpoint requires regular authentication (not API key)
    if (!currentUser) {
      throw Errors.NOT_AUTHENTICATED;
    }

    const result = await sails.helpers.apiKeys.generateKey.with({
      userId: currentUser.id.toString(),
      name: inputs.name,
      description: inputs.description,
      expiresAt: inputs.expiresAt,
      permissions: inputs.permissions,
    });

    this.res.status(201);
    return {
      apiKey: result.apiKey, // The actual key - only shown once!
      item: {
        id: result.record.id,
        name: result.record.name,
        description: result.record.description,
        expiresAt: result.record.expiresAt,
        permissions: result.record.permissions,
        createdAt: result.record.createdAt,
      },
    };
  },
};
