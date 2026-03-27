'use strict';

const axios = require('axios');
const config = require('../config');

// In-memory rate limit tracker (per-process; fine for single-instance server)
const rateLimitState = {
  requestCount: 0,
  windowStart: Date.now(),
};

/**
 * Sleep for the given number of milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check rate limit and wait if needed before making a request.
 */
async function checkRateLimit() {
  const now = Date.now();

  // Reset window if expired
  if (now - rateLimitState.windowStart >= config.strava.rateLimitWindow) {
    rateLimitState.requestCount = 0;
    rateLimitState.windowStart = now;
  }

  // If at the limit, wait until the window resets
  if (rateLimitState.requestCount >= config.strava.rateLimitMax) {
    const waitMs = config.strava.rateLimitWindow - (now - rateLimitState.windowStart) + 1000;
    console.log(`[Strava] Rate limit reached. Waiting ${Math.round(waitMs / 1000)}s...`);
    await sleep(waitMs);
    rateLimitState.requestCount = 0;
    rateLimitState.windowStart = Date.now();
  }

  rateLimitState.requestCount++;
}

/**
 * Make a Strava API request with retry logic for rate limiting.
 */
async function stravaRequest(accessToken, method, path, params = {}, retries = 3) {
  await checkRateLimit();

  try {
    const response = await axios({
      method,
      url: `${config.strava.apiBase}${path}`,
      headers: { Authorization: `Bearer ${accessToken}` },
      params: method === 'get' ? params : undefined,
      data: method !== 'get' ? params : undefined,
    });

    // Update rate limit state from response headers
    const usage = response.headers['x-ratelimit-usage'];
    if (usage) {
      const [shortTerm] = usage.split(',').map(Number);
      rateLimitState.requestCount = shortTerm;
    }

    return response.data;
  } catch (err) {
    if (err.response?.status === 429 && retries > 0) {
      // Respect Retry-After header or wait 15 minutes
      const retryAfter = parseInt(err.response.headers['retry-after'] || '900', 10);
      console.log(`[Strava] 429 Too Many Requests. Retrying after ${retryAfter}s...`);
      await sleep(retryAfter * 1000);
      return stravaRequest(accessToken, method, path, params, retries - 1);
    }

    if (err.response?.status === 401) {
      throw new Error('STRAVA_UNAUTHORIZED');
    }

    throw err;
  }
}

/**
 * Exchange an authorization code for access/refresh tokens.
 */
async function exchangeCode(code) {
  const response = await axios.post(config.strava.tokenUrl, {
    client_id: config.strava.clientId,
    client_secret: config.strava.clientSecret,
    code,
    grant_type: 'authorization_code',
  });
  return response.data;
}

/**
 * Refresh an expired access token.
 */
async function refreshToken(refreshTokenValue) {
  const response = await axios.post(config.strava.tokenUrl, {
    client_id: config.strava.clientId,
    client_secret: config.strava.clientSecret,
    refresh_token: refreshTokenValue,
    grant_type: 'refresh_token',
  });
  return response.data;
}

/**
 * Get a valid access token, refreshing it if expired.
 */
async function getValidToken(user, prisma) {
  const now = new Date();
  const expiresAt = new Date(user.tokenExpiresAt);

  // Refresh if expiring within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log(`[Strava] Refreshing token for user ${user.id}`);
    const refreshed = await refreshToken(user.refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        tokenExpiresAt: new Date(refreshed.expires_at * 1000),
      },
    });

    return refreshed.access_token;
  }

  return user.accessToken;
}

/**
 * Fetch the authenticated athlete's profile.
 */
async function getAthlete(accessToken) {
  return stravaRequest(accessToken, 'get', '/athlete');
}

/**
 * Fetch a single page of activities.
 */
async function getActivitiesPage(accessToken, page = 1, perPage = 200) {
  return stravaRequest(accessToken, 'get', '/athlete/activities', {
    page,
    per_page: perPage,
  });
}

/**
 * Fetch ALL activities for a user, handling pagination.
 * Calls onProgress(fetched, total) as pages arrive.
 */
async function getAllActivities(accessToken, onProgress) {
  const allActivities = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    console.log(`[Strava] Fetching activities page ${page}...`);
    const activities = await getActivitiesPage(accessToken, page, perPage);

    if (!activities || activities.length === 0) break;

    allActivities.push(...activities);
    if (onProgress) onProgress(allActivities.length);

    // If we got fewer than perPage, we've reached the end
    if (activities.length < perPage) break;

    page++;

    // Small delay between pages to be respectful of rate limits
    await sleep(200);
  }

  return allActivities;
}

/**
 * Build the Strava OAuth authorization URL.
 */
function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: config.strava.clientId,
    redirect_uri: config.strava.redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
    state: state || '',
  });
  return `${config.strava.authUrl}?${params}`;
}

module.exports = {
  exchangeCode,
  refreshToken,
  getValidToken,
  getAthlete,
  getActivitiesPage,
  getAllActivities,
  getAuthUrl,
  stravaRequest,
};
