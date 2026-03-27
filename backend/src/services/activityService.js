'use strict';

const { getPrisma } = require('./prisma');

/**
 * Map a raw Strava activity object to Prisma schema fields.
 */
function mapStravaActivity(raw, userId) {
  return {
    stravaId: String(raw.id),
    userId,
    name: raw.name || 'Untitled',
    description: raw.description || null,
    type: raw.type || 'Other',
    sportType: raw.sport_type || raw.type || 'Other',
    distance: raw.distance || 0,
    movingTime: raw.moving_time || 0,
    elapsedTime: raw.elapsed_time || 0,
    totalElevationGain: raw.total_elevation_gain || 0,
    startDate: new Date(raw.start_date),
    startDateLocal: new Date(raw.start_date_local),
    timezone: raw.timezone || null,
    averageSpeed: raw.average_speed ?? null,
    maxSpeed: raw.max_speed ?? null,
    averageHeartrate: raw.average_heartrate ?? null,
    maxHeartrate: raw.max_heartrate ?? null,
    averageCadence: raw.average_cadence ?? null,
    averageWatts: raw.average_watts ?? null,
    normalizedPower: raw.weighted_average_watts ?? null,
    kilojoules: raw.kilojoules ?? null,
    calories: raw.calories ?? null,
    kudosCount: raw.kudos_count || 0,
    achievementCount: raw.achievement_count || 0,
    mapSummaryPolyline: raw.map?.summary_polyline || null,
    startLat: raw.start_latlng?.[0] ?? null,
    startLng: raw.start_latlng?.[1] ?? null,
    endLat: raw.end_latlng?.[0] ?? null,
    endLng: raw.end_latlng?.[1] ?? null,
    gearId: raw.gear_id || null,
    deviceName: raw.device_name || null,
  };
}

/**
 * Upsert a batch of Strava activities for a user.
 * Returns count of upserted records.
 */
async function upsertActivities(userId, stravaActivities) {
  const prisma = getPrisma();

  // Process in batches to avoid SQLite limits
  const BATCH_SIZE = 50;
  let total = 0;

  for (let i = 0; i < stravaActivities.length; i += BATCH_SIZE) {
    const batch = stravaActivities.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((raw) =>
        prisma.activity.upsert({
          where: { stravaId: String(raw.id) },
          create: mapStravaActivity(raw, userId),
          update: mapStravaActivity(raw, userId),
        })
      )
    );

    total += batch.length;
  }

  return total;
}

/**
 * Query activities with filtering, search, and pagination.
 */
async function getActivities(userId, opts = {}) {
  const prisma = getPrisma();

  const {
    page = 1,
    limit = 20,
    type,
    types, // comma-separated list for group filters
    minDistance,
    maxDistance,
    minDuration,
    maxDuration,
    startDate,
    endDate,
    search,
    sortBy = 'startDate',
    sortOrder = 'desc',
  } = opts;

  const where = { userId };

  // Activity type filter — single type or comma-separated group
  if (types) {
    const list = (Array.isArray(types) ? types : types.split(',')).filter(Boolean);
    if (list.length === 1) where.sportType = list[0];
    else if (list.length > 1) where.sportType = { in: list };
  } else if (type && type !== 'all') {
    where.sportType = type;
  }

  // Distance filter (Strava stores in meters)
  if (minDistance !== undefined || maxDistance !== undefined) {
    where.distance = {};
    if (minDistance !== undefined) where.distance.gte = parseFloat(minDistance);
    if (maxDistance !== undefined) where.distance.lte = parseFloat(maxDistance);
  }

  // Duration filter (moving_time in seconds)
  if (minDuration !== undefined || maxDuration !== undefined) {
    where.movingTime = {};
    if (minDuration !== undefined) where.movingTime.gte = parseInt(minDuration, 10);
    if (maxDuration !== undefined) where.movingTime.lte = parseInt(maxDuration, 10);
  }

  // Date filter
  if (startDate || endDate) {
    where.startDateLocal = {};
    if (startDate) where.startDateLocal.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.startDateLocal.lte = end;
    }
  }

  // Full-text search on name and description
  if (search && search.trim()) {
    where.OR = [
      { name: { contains: search.trim() } },
      { description: { contains: search.trim() } },
    ];
  }

  const validSortFields = ['startDate', 'distance', 'movingTime', 'totalElevationGain', 'name'];
  const orderBy = validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' }
    : { startDate: 'desc' };

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const take = Math.min(100, parseInt(limit, 10)); // cap at 100

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({ where, orderBy, skip, take }),
    prisma.activity.count({ where }),
  ]);

  return {
    activities,
    pagination: {
      page: parseInt(page, 10),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
      hasNext: skip + take < total,
      hasPrev: parseInt(page, 10) > 1,
    },
  };
}

/**
 * Get aggregate stats for a user's activities.
 */
async function getStats(userId) {
  const prisma = getPrisma();

  const [total, sportTypeCounts, aggregates] = await Promise.all([
    prisma.activity.count({ where: { userId } }),
    prisma.activity.groupBy({
      by: ['sportType'],
      where: { userId },
      _count: { sportType: true },
      orderBy: { _count: { sportType: 'desc' } },
    }),
    prisma.activity.aggregate({
      where: { userId },
      _sum: { distance: true, movingTime: true, totalElevationGain: true, calories: true },
      _avg: { distance: true, movingTime: true },
    }),
  ]);

  return {
    totalActivities: total,
    sportTypes: sportTypeCounts.map((r) => ({ type: r.sportType, count: r._count.sportType })),
    totals: {
      distance: aggregates._sum.distance || 0,
      movingTime: aggregates._sum.movingTime || 0,
      elevationGain: aggregates._sum.totalElevationGain || 0,
      calories: aggregates._sum.calories || 0,
    },
    averages: {
      distance: aggregates._avg.distance || 0,
      movingTime: aggregates._avg.movingTime || 0,
    },
  };
}

module.exports = { upsertActivities, getActivities, getStats, mapStravaActivity };
