/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /external/cards:
 *   post:
 *     summary: Create card (External API)
 *     description: Creates a card within a list using API key authentication
 *     tags:
 *       - External API
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - boardId
 *               - listId
 *               - name
 *             properties:
 *               boardId:
 *                 type: string
 *                 description: ID of the board
 *                 example: "1357158568008091264"
 *               listId:
 *                 type: string
 *                 description: ID of the list
 *                 example: "1357158568008091265"
 *               name:
 *                 type: string
 *                 maxLength: 1024
 *                 description: Name/title of the card
 *                 example: Buy groceries
 *               description:
 *                 type: string
 *                 maxLength: 1048576
 *                 description: Detailed description
 *                 example: Milk, eggs, bread
 *               position:
 *                 type: number
 *                 description: Position within list (null for bottom)
 *                 example: null
 *               type:
 *                 type: string
 *                 enum: [project, story]
 *                 description: Type of card
 *                 example: project
 *     responses:
 *       201:
 *         description: Card created successfully
 *       401:
 *         description: Invalid or missing API key
 *       403:
 *         description: Not enough rights
 *       404:
 *         description: List or board not found
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
  LIST_NOT_FOUND: {
    listNotFound: 'List not found',
  },
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
  POSITION_MUST_BE_PRESENT: {
    positionMustBePresent: 'Position must be present',
  },
};

module.exports = {
  inputs: {
    boardId: {
      ...idInput,
      required: true,
    },
    listId: {
      ...idInput,
      required: true,
    },
    type: {
      type: 'string',
      isIn: Object.values(Card.Types),
      defaultsTo: Card.Types.PROJECT,
    },
    position: {
      type: 'number',
      min: 0,
      allowNull: true,
    },
    name: {
      type: 'string',
      maxLength: 1024,
      required: true,
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
  },

  exits: {
    notAuthenticated: {
      responseType: 'unauthorized',
    },
    notEnoughRights: {
      responseType: 'forbidden',
    },
    listNotFound: {
      responseType: 'notFound',
    },
    boardNotFound: {
      responseType: 'notFound',
    },
    positionMustBePresent: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser, isExternalApi } = this.req;

    // Ensure API key authentication was used
    if (!isExternalApi || !currentUser) {
      throw Errors.NOT_AUTHENTICATED;
    }

    // Verify the list and board exist and get the project path
    const { list, board, project } = await sails.helpers.lists
      .getPathToProjectById(inputs.listId)
      .intercept('pathNotFound', () => Errors.LIST_NOT_FOUND);

    // Verify the boardId matches
    if (board.id !== inputs.boardId) {
      throw Errors.BOARD_NOT_FOUND;
    }

    // Check if user has access to this board
    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.LIST_NOT_FOUND; // Forbidden
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const values = _.pick(inputs, [
      'type',
      'position',
      'name',
      'description',
      'dueDate',
      'isDueCompleted',
      'stopwatch',
    ]);

    const card = await sails.helpers.cards.createOne
      .with({
        project,
        values: {
          ...values,
          board,
          list,
          creatorUser: currentUser,
        },
        request: this.req,
      })
      .intercept('positionMustBeInValues', () => Errors.POSITION_MUST_BE_PRESENT);

    this.res.status(201);
    return {
      item: card,
    };
  },
};
