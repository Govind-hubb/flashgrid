const { getRedisClient, isRedisConnected } = require('../config/redis');

// In-memory idempotency cache fallback
const memoryIdempotencyStore = new Map();

/**
 * Idempotency Middleware
 * Ensures that if a client sends duplicate requests with the same X-Idempotency-Key
 * (e.g., due to network retry or multiple fast clicks), the server returns the cached response
 * without performing the transaction twice.
 */
const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];

  if (!idempotencyKey) {
    // If no key is provided, proceed normally
    return next();
  }

  const cacheKey = `idemp:${idempotencyKey}`;

  try {
    if (isRedisConnected()) {
      const redis = getRedisClient();
      const cachedResponse = await redis.get(cacheKey);

      if (cachedResponse) {
        console.log(`🛡️ [IDEMPOTENCY_HIT] Returned cached result for key: ${idempotencyKey}`);
        const parsed = JSON.parse(cachedResponse);
        return res.status(parsed.status).json(parsed.body);
      }
    } else {
      if (memoryIdempotencyStore.has(cacheKey)) {
        console.log(`🛡️ [IDEMPOTENCY_HIT_MEM] Returned cached result for key: ${idempotencyKey}`);
        const cached = memoryIdempotencyStore.get(cacheKey);
        return res.status(cached.status).json(cached.body);
      }
    }

    // Intercept res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const status = res.statusCode || 200;
      const dataToCache = JSON.stringify({ status, body });

      if (isRedisConnected()) {
        const redis = getRedisClient();
        redis.set(cacheKey, dataToCache, 'EX', 86400).catch(() => {}); // 24h retention
      } else {
        memoryIdempotencyStore.set(cacheKey, { status, body });
      }

      return originalJson(body);
    };

    next();
  } catch (error) {
    next();
  }
};

module.exports = idempotencyMiddleware;
