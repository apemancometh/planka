/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * ApiKey.js
 *
 * @description :: Model for external API authentication keys
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 * @updated     :: 2025-11-14 - Fixed ref type validation
 */

module.exports = {
  tableName: 'api_key',

  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    key: {
      type: 'string',
      required: true,
      unique: true,
      isNotEmptyString: true,
      description: 'The actual API key value (hashed)',
    },
    name: {
      type: 'string',
      required: true,
      maxLength: 255,
      description: 'Friendly name for this API key',
    },
    description: {
      type: 'string',
      maxLength: 1024,
      allowNull: true,
      description: 'Optional description of what this key is used for',
    },
    lastUsedAt: {
      type: 'ref',
      columnName: 'last_used_at',
      description: 'Last time this key was used',
    },
    expiresAt: {
      type: 'ref',
      columnName: 'expires_at',
      description: 'Optional expiration date for the key',
    },
    isActive: {
      type: 'boolean',
      defaultsTo: true,
      columnName: 'is_active',
      description: 'Whether the key is currently active',
    },
    permissions: {
      type: 'json',
      defaultsTo: {},
      description: 'JSON object defining permissions (boards, operations, etc.)',
    },
    deletedAt: {
      type: 'ref',
      columnName: 'deleted_at',
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    userId: {
      model: 'User',
      required: true,
      columnName: 'user_id',
      description: 'The user this API key belongs to',
    },
  },
};
