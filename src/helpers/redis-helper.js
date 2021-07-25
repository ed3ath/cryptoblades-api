const Redis = require('ioredis');

let redis;
const CACHE_URL = process.env.REDIS_URL;

const init = async () => {
  if (!CACHE_URL) return;
  console.log(`Connecting to Redis @ ${CACHE_URL}`);
  redis = new Redis(CACHE_URL);
};

module.exports.startRedis = init;
module.exports.redis = redis;
