const { DB } = require('../../db');

exports.route = (app) => {
  app.get('/static/market/transactions/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Invalid query. Must pass id.' });
    }

    try {
      const resultsCursor = await DB.$marketSales.find({ sellerAddress: id });

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
