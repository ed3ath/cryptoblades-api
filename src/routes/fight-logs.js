const { DB } = require('../db');

exports.route = (app) => {
  app.get('/static/fights/:accountAddress', async (req, res) => {
    const { accountAddress } = req.params;
    if (!accountAddress) {
      return res
        .status(400)
        .json({ error: 'Invalid query. Must pass account address.' });
    }

    let fights;

    try {
      fights = await DB.$fights.find({ accountAddress });
    } catch (error) {
      return res.status(500).json({ error });
    }

    return res.json(fights);
  });
};
