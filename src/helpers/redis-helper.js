const { createClient } = require('redis');

let redis;

if(process.env.REDIS_URL) {

  (async () => {
      redis = createClient(process.env.REDIS_URL);
      redis.on('error', (err) => console.log('Redis Client Error', err));
      await redis.connect();
  })();
  
}

module.exports.redis = redis;