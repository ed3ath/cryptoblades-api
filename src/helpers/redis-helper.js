const { createClient } = require('redis');

let redis;

const init = async () => {
  if (!process.env.REDIS_URL) return;
  console.log(`Connecting to Redis @ ${process.env.REDIS_URL}`);
  redis = createClient(process.env.REDIS_URL);
  redis.on('error', (err) => console.log('Redis Client Error', err));
  await redis.connect();
};

module.exports.startRedis = init;
module.exports.redis = redis;
