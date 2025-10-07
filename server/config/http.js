/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

const path = require('path');
const express = require('express');


module.exports.http = {
  middleware: {
    // Serve the Vite build output from client/dist
    dist: (function () {
      // __dirname === /app/server/config at runtime
      const distPath = path.resolve(__dirname, '../../client/dist');
      return express.static(distPath, { index: false, maxAge: '1h' });
    })(),

    poweredBy: false,

    // Ensure our static middleware runs BEFORE Sails' router
    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'compress',
      'poweredBy',
      'dist',     // <— serve JS/CSS/fonts/images from client/dist
      'router',
      'favicon',
      // (omit 'www' because we’re not using .tmp/public)
    ],
  },
};
