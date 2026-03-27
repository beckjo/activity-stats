'use strict';

const { getPrisma } = require('./prisma');
const {
  startOfWeek, endOfWeek, eachWeekOfInterval,
  eachMonthOfInterval, startOfMonth, endOfMonth,
  isWithinInterval,
} = require('date-fns');

/**
 * Fetch and aggregate stats for one period.
 * Uses parallel DB queries + DB-level aggregation — no full table scan in JS.
 */
async function getPeriodStats(userId, startDate, endDate, groupBy = 'week', sportTypes = []) {
  const prisma = getPrisma();

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const where = { userId, startDateLocal: { gte: start, lte: end } };
  if (sportTypes.length > 0) where.sportType = { in: sportTypes };

  // Run all three queries in parallel against the DB
  const [aggregate, byTypeRaw, timelineRows] = await Promise.all([

    // 1. Aggregate stats — single SQL aggregate query
    prisma.activity.aggregate({
      where,
      _count: { _all: true },
      _sum: { distance: true, movingTime: true, totalElevationGain: true, calories: true },
      _avg: { distance: true, movingTime: true, averageHeartrate: true, averageWatts: true, normalizedPower: true },
    }),

    // 2. Group by sport type — single SQL GROUP BY query
    prisma.activity.groupBy({
      by: ['sportType'],
      where,
      _count: { sportType: true },
      _sum: { distance: true, movingTime: true },
      orderBy: { _count: { sportType: 'desc' } },
    }),

    // 3. Timeline: fetch only date + 3 numeric fields (minimal payload)
    prisma.activity.findMany({
      where,
      select: { startDateLocal: true, distance: true, movingTime: true, totalElevationGain: true },
    }),

  ]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const total = aggregate._count._all;
  const stats = {
    totalActivities:  total,
    totalDistance:    aggregate._sum.distance        || 0,
    totalMovingTime:  aggregate._sum.movingTime      || 0,
    totalElevation:   aggregate._sum.totalElevationGain || 0,
    totalCalories:    aggregate._sum.calories        || 0,
    avgDistance:      aggregate._avg.distance        || 0,
    avgMovingTime:    aggregate._avg.movingTime      || 0,
    avgHeartrate:     aggregate._avg.averageHeartrate    ?? null,
    avgWatts:         aggregate._avg.averageWatts        ?? null,
    avgNormalizedPower: aggregate._avg.normalizedPower   ?? null,
  };

  // ── By sport type ─────────────────────────────────────────────────────────────
  const byType = byTypeRaw.map((r) => ({
    type:       r.sportType,
    count:      r._count.sportType,
    distance:   r._sum.distance   || 0,
    movingTime: r._sum.movingTime || 0,
  }));

  // ── Timeline buckets (JS grouping on the minimal date+3-field dataset) ────────
  const buckets = groupBy === 'month'
    ? eachMonthOfInterval({ start, end }).map((d, i) => ({
        label: `Month ${i + 1}`,
        interval: { start: startOfMonth(d), end: endOfMonth(d) },
      }))
    : eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((d, i) => ({
        label: `Wk ${i + 1}`,
        interval: { start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) },
      }));

  // Build an index: ISO-date string → bucket index for O(n) instead of O(n*buckets)
  const dateToBucket = new Map();
  buckets.forEach(({ interval }, idx) => {
    const s = interval.start;
    const e = interval.end;
    for (const row of timelineRows) {
      const d = new Date(row.startDateLocal);
      if (d >= s && d <= e) dateToBucket.set(row, idx);
    }
  });

  const bucketData = buckets.map(() => ({ count: 0, distance: 0, movingTime: 0, elevation: 0 }));
  for (const row of timelineRows) {
    const idx = dateToBucket.get(row);
    if (idx === undefined) continue;
    bucketData[idx].count++;
    bucketData[idx].distance   += row.distance            || 0;
    bucketData[idx].movingTime += row.movingTime          || 0;
    bucketData[idx].elevation  += row.totalElevationGain  || 0;
  }

  const timeline = buckets.map(({ label }, i) => ({ label, ...bucketData[i] }));

  return { stats, byType, timeline };
}

module.exports = { getPeriodStats };
