'use strict';

const { getPrisma } = require('./prisma');
const stravaService = require('./stravaService');
const { upsertActivities } = require('./activityService');

// Track active sync jobs (userId -> AbortController-like flag)
const activeSyncs = new Map();

/**
 * Start a background sync for a user.
 * Returns immediately; sync runs in background.
 */
async function startSync(userId) {
  const prisma = getPrisma();

  // Prevent duplicate syncs
  if (activeSyncs.get(userId)) {
    console.log(`[Sync] User ${userId} already syncing, skipping.`);
    return;
  }

  activeSyncs.set(userId, true);

  // Update sync status
  await prisma.user.update({
    where: { id: userId },
    data: { syncStatus: 'syncing', syncError: null },
  });

  // Run async (fire and forget)
  runSync(userId).catch((err) => {
    console.error(`[Sync] Unexpected error for user ${userId}:`, err);
  });
}

/**
 * Core sync logic: fetch all Strava activities and store them.
 */
async function runSync(userId) {
  const prisma = getPrisma();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Get a valid (possibly refreshed) access token
    const accessToken = await stravaService.getValidToken(user, prisma);

    console.log(`[Sync] Starting full activity sync for user ${userId}...`);

    let totalFetched = 0;

    const activities = await stravaService.getAllActivities(accessToken, (count) => {
      totalFetched = count;
      console.log(`[Sync] User ${userId}: fetched ${count} activities so far...`);
    });

    console.log(`[Sync] User ${userId}: fetched ${activities.length} total. Upserting...`);

    await upsertActivities(userId, activities);

    await prisma.user.update({
      where: { id: userId },
      data: {
        syncStatus: 'complete',
        lastSyncAt: new Date(),
        syncError: null,
      },
    });

    console.log(`[Sync] User ${userId}: sync complete. ${activities.length} activities stored.`);
  } catch (err) {
    console.error(`[Sync] Error for user ${userId}:`, err.message);

    await getPrisma()
      .user.update({
        where: { id: userId },
        data: { syncStatus: 'error', syncError: err.message },
      })
      .catch(() => {}); // ignore update errors
  } finally {
    activeSyncs.delete(userId);
  }
}

/**
 * Check if a user is currently syncing.
 */
function isSyncing(userId) {
  return !!activeSyncs.get(userId);
}

module.exports = { startSync, isSyncing };
