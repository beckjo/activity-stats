'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const stravaService = require('../services/stravaService');
const syncService = require('../services/syncService');
const { getPrisma } = require('../services/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/auth/strava
 * Redirect the user to Strava OAuth.
 */
router.get('/strava', (req, res) => {
  const state = Math.random().toString(36).substring(2);
  const authUrl = stravaService.getAuthUrl(state);
  res.redirect(authUrl);
});

/**
 * GET /api/auth/callback
 * Handle Strava OAuth callback, create/update user, issue JWT.
 */
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    const reason = error || 'no_code';
    return res.redirect(`${config.frontendUrl}/auth/error?reason=${reason}`);
  }

  try {
    const prisma = getPrisma();

    // Exchange code for tokens
    const tokenData = await stravaService.exchangeCode(code);

    if (!tokenData.athlete) {
      throw new Error('No athlete data in token response');
    }

    const athlete = tokenData.athlete;

    // Upsert user
    const user = await prisma.user.upsert({
      where: { stravaId: athlete.id },
      create: {
        stravaId: athlete.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(tokenData.expires_at * 1000),
        firstName: athlete.firstname || null,
        lastName: athlete.lastname || null,
        profilePicture: athlete.profile || null,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(tokenData.expires_at * 1000),
        firstName: athlete.firstname || null,
        lastName: athlete.lastname || null,
        profilePicture: athlete.profile || null,
      },
    });

    // Issue JWT
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Kick off background sync if first time (no activities yet) or status is idle/error
    if (user.syncStatus === 'idle' || user.syncStatus === 'error') {
      syncService.startSync(user.id).catch(console.error);
    }

    // Redirect to frontend with token
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('[Auth] Callback error:', err);
    res.redirect(`${config.frontendUrl}/auth/error?reason=server_error`);
  }
});

/**
 * GET /api/auth/me
 * Return current authenticated user's profile.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        stravaId: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        syncStatus: true,
        syncError: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('[Auth] /me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Client-side logout — just confirms. JWT invalidation is client responsibility.
 */
router.post('/logout', requireAuth, (req, res) => {
  res.json({ success: true });
});

module.exports = router;
