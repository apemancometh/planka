/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /external/cards/{cardId}:
 *   get:
 *     summary: Get card details (External API)
 *     description: Returns detailed information about a card
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
 *     responses:
 *       200:
 *         description: Card details
 *       401:
 *         description: Invalid or missing API key
 *       403:
 *         description: No access to card
 *       404:
 *         description: Card not found
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_AUTHENTICATED: {
    notAuthenticated: 'API key authentication required',
  },
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
  NO_ACCESS: {
    noAccess: 'No access to this card',
  },
};

module.exports = {
  inputs: {
    cardId: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notAuthenticated: {
      responseType: 'unauthorized',
    },
    cardNotFound: {
      responseType: 'notFound',
    },
    noAccess: {
      responseType: 'forbidden',
    },
  },

  async fn(inputs) {
    const { currentUser, isExternalApi } = this.req;

    // Ensure API key authentication was used
    if (!isExternalApi || !currentUser) {
      throw Errors.NOT_AUTHENTICATED;
    }

    // Get the card
    const card = await Card.findOne({ id: inputs.cardId });

    if (!card) {
      throw Errors.CARD_NOT_FOUND;
    }

    // Check if user has access to the board this card belongs to
    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      card.boardId,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.NO_ACCESS;
    }

    // Get related data
    const list = await List.findOne({ id: card.listId });
    const board = await Board.findOne({ id: card.boardId });

    return {
      item: {
        id: card.id,
        name: card.name,
        description: card.description,
        type: card.type,
        position: card.position,
        dueDate: card.dueDate,
        isDueCompleted: card.isDueCompleted,
        stopwatch: card.stopwatch,
        boardId: card.boardId,
        boardName: board?.name,
        listId: card.listId,
        listName: list?.name,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      },
    };
  },
};
