const { DB } = require('../db');

exports.route = (app) => {
  app.get('/static/fights/:accountAddress', async (req, res) => {
    const { accountAddress } = req.params;
    if (!accountAddress) {
      return res
        .status(400)
        .json({ error: 'Invalid query. Must pass account address.' });
    }

    try {
      const resultsCursor = await DB.$fights.find({ accountAddress });

      const results = await resultsCursor.toArray();
      
      return res.json({
        results,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }
  });
};
