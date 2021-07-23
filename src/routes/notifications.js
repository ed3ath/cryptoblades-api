const { DB } = require('../db');

exports.route = (app) => {
  app.get('/static/notifications', async (req, res) => {
    const data = await DB.$notifications.find({}, { sort: { timestamp: -1 }, limit: 10 });
    const retData = await data.toArray();
    res.json(retData);
  });
};
