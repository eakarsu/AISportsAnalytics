const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, body, duration);
      return originalJson(body);
    };

    next();
  };
};

const invalidateCache = (patterns = []) => {
  if (patterns.length === 0) {
    cache.flushAll();
    return;
  }
  const keys = cache.keys();
  keys.forEach(key => {
    if (patterns.some(p => key.includes(p))) {
      cache.del(key);
    }
  });
};

module.exports = { cache, cacheMiddleware, invalidateCache };
