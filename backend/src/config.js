'use strict';

require('dotenv').config();

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  strava: {
    clientId: required('STRAVA_CLIENT_ID'),
    clientSecret: required('STRAVA_CLIENT_SECRET'),
    redirectUri: required('STRAVA_REDIRECT_URI'),
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    apiBase: 'https://www.strava.com/api/v3',
    // Strava rate limits: 100 req/15min, 1000 req/day
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes in ms
    rateLimitMax: 95, // stay under 100
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: '30d',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
