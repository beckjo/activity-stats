'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getPeriodStats } = require('../services/compareService');

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/compare
 * Query: aStart, aEnd, bStart, bEnd, groupBy (week|month)
 */
router.get('/', async (req, res) => {
  const { aStart, aEnd, bStart, bEnd, groupBy = 'week', sportTypes } = req.query;

  if (!aStart || !aEnd || !bStart || !bEnd) {
    return res.status(400).json({ error: 'aStart, aEnd, bStart, bEnd are required' });
  }

  // sportTypes can be a comma-separated string or array from repeated params
  const types = sportTypes
    ? (Array.isArray(sportTypes) ? sportTypes : sportTypes.split(',')).filter(Boolean)
    : [];

  try {
    const [periodA, periodB] = await Promise.all([
      getPeriodStats(req.userId, aStart, aEnd, groupBy, types),
      getPeriodStats(req.userId, bStart, bEnd, groupBy, types),
    ]);

    res.json({ periodA, periodB });
  } catch (err) {
    console.error('[Compare] error:', err);
    res.status(500).json({ error: 'Failed to compute comparison' });
  }
});

module.exports = router;
