const { DB } = require('../db');

exports.route = (app) => {
  app.post('/leaderboard/market/sell/add', async (req, res) => {
    const {
      hash, accountAddress, buyerAddress, nftAddress, nftId, price, gas,
    } = req.body;
    if (!hash || !accountAddress || !buyerAddress || !nftAddress || !nftId || !price) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, buyerAddress, nftAddress, nftId, price.' });
    }

    try {
      await DB.$marketsells.replaceOne({ hash }, {
        hash, accountAddress, buyerAddress, nftAddress, nftId, price, gas,
      }, { upsert: true });
    } catch (error) {
      return res.status(400).json({ error });
    }

    return res.json({ added: true });
  });
};
