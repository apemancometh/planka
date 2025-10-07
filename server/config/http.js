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
    // Serve built SPA assets
    dist: (function () {
      const distPath = path.resolve(__dirname, '../../client/dist');
      return express.static(distPath, { index: false, maxAge: '1h' });
    })(),

    // Minimal CORS middleware (handles preflight + sets headers)
    corsHeaders: function corsHeaders(req, res, next) {
      const origin = req.headers.origin;
      // If you only serve the SPA from the same origin, allow just that.
      // Otherwise, fall back to echoing the Origin (with Vary) for credentialed requests.
      if (origin) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Vary', 'Origin');
      } else {
        res.set('Access-Control-Allow-Origin', '*');
      }
      res.set('Access-Control-Allow-Credentials', 'true');
      res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.set(
        'Access-Control-Allow-Headers',
        req.headers['access-control-request-headers'] || 'content-type, authorization, x-requested-with'
      );
      if (req.method === 'OPTIONS') return res.sendStatus(204);
      return next();
    },

    poweredBy: false,

    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'compress',
      'poweredBy',
      'corsHeaders', // <— CORS headers & preflight
      'dist',        // <— static SPA assets
      'router',
      'favicon',
    ],
  },
};
