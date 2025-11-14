/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /external/cards/{cardId}:
 *   patch:
 *     summary: Update card (External API)
 *     description: Updates card properties
 *     tags:
 *       - External API
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: cardId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 1024
 *               description:
 *                 type: string
 *                 maxLength: 1048576
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               isDueCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Card updated successfully
 *       401:
 *         description: Invalid or missing API key
 *       403:
 *         description: Not enough rights
 *       404:
 *         description: Card not found
 */

const { isDueDate, isStopwatch } = require('../../../../../utils/validators');
const { idInput } = require('../../../../../utils/inputs');

const Errors = {
  NOT_AUTHENTICATED: {
    notAuthenticated: 'API key authentication required',
  },
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
};

module.exports = {
  inputs: {
    cardId: {
      ...idInput,
      required: true,
    },
    name: {
      type: 'string',
      maxLength: 1024,
    },
    description: {
      type: 'string',
      isNotEmptyString: true,
      maxLength: 1048576,
      allowNull: true,
    },
    dueDate: {
      type: 'string',
      custom: isDueDate,
    },
    isDueCompleted: {
      type: 'boolean',
      allowNull: true,
    },
    stopwatch: {
      type: 'json',
      custom: isStopwatch,
    },
    position: {
      type: 'number',
      min: 0,
    },
  },

  exits: {
    notAuthenticated: {
      responseType: 'unauthorized',
    },
    notEnoughRights: {
      responseType: 'forbidden',
    },
    cardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser, isExternalApi } = this.req;

    // Ensure API key authentication was used
    if (!isExternalApi || !currentUser) {
      throw Errors.NOT_AUTHENTICATED;
    }

    // Get the card with project path
    const { card, board } = await sails.helpers.cards
      .getPathToBoardById(inputs.cardId)
      .intercept('pathNotFound', () => Errors.CARD_NOT_FOUND);

    // Check if user has editor access to the board
    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.CARD_NOT_FOUND; // Forbidden
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const values = _.pick(inputs, [
      'name',
      'description',
      'dueDate',
      'isDueCompleted',
      'stopwatch',
      'position',
    ]);

    const updatedCard = await sails.helpers.cards.updateOne(card, values, this.req);

    return {
      item: updatedCard,
    };
  },
};
