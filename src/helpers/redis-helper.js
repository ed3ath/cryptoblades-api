const { createClient } = require('redis');

let redis;
const CACHE_URL = process.env.REDIS_URL;

const init = async () => {
  if (!CACHE_URL) return;
  console.log(`Connecting to Redis @ ${CACHE_URL}`);
  redis = createClient(CACHE_URL);
  redis.on('error', (err) => console.log('Redis Client Error', err));
  await redis.connect();
};

module.exports.startRedis = init;
module.exports.redis = redis;
