'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const activityService = require('../services/activityService');
const syncService = require('../services/syncService');
const { getPrisma } = require('../services/prisma');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/activities
 * List activities with filtering, search, and pagination.
 *
 * Query params:
 *   page, limit, type, minDistance, maxDistance,
 *   minDuration, maxDuration, startDate, endDate,
 *   search, sortBy, sortOrder
 */
router.get('/', async (req, res) => {
  try {
    const result = await activityService.getActivities(req.userId, req.query);
    res.json(result);
  } catch (err) {
    console.error('[Activities] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

/**
 * GET /api/activities/stats
 * Aggregate stats for the authenticated user.
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await activityService.getStats(req.userId);
    res.json(stats);
  } catch (err) {
    console.error('[Activities] GET /stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/activities/types
 * Distinct activity sport types for the user (for filter dropdown).
 */
router.get('/types', async (req, res) => {
  try {
    const prisma = getPrisma();
    const types = await prisma.activity.findMany({
      where: { userId: req.userId },
      select: { sportType: true },
      distinct: ['sportType'],
      orderBy: { sportType: 'asc' },
    });
    res.json({ types: types.map((t) => t.sportType) });
  } catch (err) {
    console.error('[Activities] GET /types error:', err);
    res.status(500).json({ error: 'Failed to fetch activity types' });
  }
});

/**
 * GET /api/activities/sync-status
 * Return current sync status for the user.
 */
router.get('/sync-status', async (req, res) => {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { syncStatus: true, syncError: true, lastSyncAt: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const activityCount = await prisma.activity.count({ where: { userId: req.userId } });

    res.json({ ...user, activityCount });
  } catch (err) {
    console.error('[Activities] GET /sync-status error:', err);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

/**
 * POST /api/activities/sync
 * Trigger a full re-sync from Strava.
 */
router.post('/sync', async (req, res) => {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.syncStatus === 'syncing') {
      return res.json({ message: 'Sync already in progress' });
    }

    await syncService.startSync(req.userId);

    res.json({ message: 'Sync started' });
  } catch (err) {
    console.error('[Activities] POST /sync error:', err);
    res.status(500).json({ error: 'Failed to start sync' });
  }
});

/**
 * GET /api/activities/:id
 * Get a single activity by DB id.
 */
router.get('/:id', async (req, res) => {
  try {
    const prisma = getPrisma();
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid activity ID' });

    const activity = await prisma.activity.findFirst({
      where: { id, userId: req.userId },
    });

    if (!activity) return res.status(404).json({ error: 'Activity not found' });

    res.json({ activity });
  } catch (err) {
    console.error('[Activities] GET /:id error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

module.exports = router;
