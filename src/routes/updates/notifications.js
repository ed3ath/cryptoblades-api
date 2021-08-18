const { DB } = require('../../db');
const { redis } = require('../../helpers/redis-helper');

exports.route = (app) => {
  app.get('/static/notifications', async (req, res) => {
    if (redis) {
      const cached = await redis.exists('notifications');
      if (cached) {
        const dataRedis = await redis.get('notifications');
        const data = JSON.parse(dataRedis);
        if (data && data.length > 0) {
          res.json(data);
          return;
        }
      }
    }

    const data = await DB.$notifications.find({}, { sort: { timestamp: -1 }, limit: 10 });
    const retData = await data.toArray();

    if (redis) redis.set('notifications', JSON.stringify(retData), 'ex', 450);

    res.json(retData);
  });
};
