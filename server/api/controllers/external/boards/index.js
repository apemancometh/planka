/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /external/boards:
 *   get:
 *     summary: List accessible boards (External API)
 *     description: Returns all boards the authenticated user has access to
 *     tags:
 *       - External API
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of boards
 *       401:
 *         description: Invalid or missing API key
 */

const Errors = {
  NOT_AUTHENTICATED: {
    notAuthenticated: 'API key authentication required',
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
    const { currentUser, isExternalApi } = this.req;

    // Ensure API key authentication was used
    if (!isExternalApi || !currentUser) {
      throw Errors.NOT_AUTHENTICATED;
    }

    // Get all board memberships for the user
    const boardMemberships = await BoardMembership.qm.getByUserId(currentUser.id);
    const boardIds = sails.helpers.utils.mapRecords(boardMemberships, 'boardId');

    if (boardIds.length === 0) {
      return {
        items: [],
      };
    }

    // Get the boards
    const boards = await Board.qm.getByIds(boardIds);

    // Get projects for these boards
    const projectIds = [...new Set(boards.map((board) => board.projectId))];
    const projects = await Project.qm.getByIds(projectIds);

    // Create a map of project id to project
    const projectMap = {};
    projects.forEach((project) => {
      projectMap[project.id] = project;
    });

    // Enhance boards with project information
    const enhancedBoards = boards.map((board) => ({
      id: board.id,
      name: board.name,
      projectId: board.projectId,
      projectName: projectMap[board.projectId]?.name,
      position: board.position,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    }));

    return {
      items: enhancedBoards,
    };
  },
};
