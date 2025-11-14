/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /external/boards/{boardId}:
 *   get:
 *     summary: Get board details (External API)
 *     description: Returns board details including lists
 *     tags:
 *       - External API
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board details
 *       401:
 *         description: Invalid or missing API key
 *       403:
 *         description: No access to board
 *       404:
 *         description: Board not found
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_AUTHENTICATED: {
    notAuthenticated: 'API key authentication required',
  },
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
  NO_ACCESS: {
    noAccess: 'No access to this board',
  },
};

module.exports = {
  inputs: {
    boardId: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notAuthenticated: {
      responseType: 'unauthorized',
    },
    boardNotFound: {
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

    // Get the board
    const board = await Board.findOne({ id: inputs.boardId });

    if (!board) {
      throw Errors.BOARD_NOT_FOUND;
    }

    // Check if user has access to this board
    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.NO_ACCESS;
    }

    // Get lists for this board
    const lists = await List.qm.getByBoardId(board.id);

    // Get project info
    const project = await Project.findOne({ id: board.projectId });

    return {
      item: {
        id: board.id,
        name: board.name,
        projectId: board.projectId,
        projectName: project?.name,
        position: board.position,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        lists: lists.map((list) => ({
          id: list.id,
          name: list.name,
          position: list.position,
        })),
      },
    };
  },
};
