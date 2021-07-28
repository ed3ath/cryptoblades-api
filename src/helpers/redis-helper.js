const Redis = require('ioredis');

let redis;
const CACHE_URL = process.env.REDIS_URL;

const init = async () => {
  console.log(`Connecting to Redis @ ${CACHE_URL}`);
  redis = new Redis(CACHE_URL, { tls: { rejectUnauthorized: false } });
};

if (CACHE_URL) init();

module.exports.redis = redis;
