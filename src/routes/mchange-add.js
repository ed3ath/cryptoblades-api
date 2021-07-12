
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/market/change/add', async (req, res) => {

    const { hash, accountAddress, nftAddress, nftId, price, gas } = req.query;
    if(!hash || !accountAddress || !nftAddress || !nftId || !price) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, nftAddress, nftId, price.' });
    }

    try {
      await DB.$marketchanges.replaceOne({ hash }, { hash, accountAddress, nftAddress, nftId, price, gas }, { upsert: true });
    } catch(error) {
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });
}
