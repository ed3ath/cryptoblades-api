
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/market/list/add', async (req, res) => {

    const { hash, accountAddress, nftAddress, nftId, price } = req.query;
    if(!hash || !accountAddress || !nftAddress || !nftId || !price) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, nftAddress, nftId, price.' });
    }

    try {
      await DB.$marketlists.replaceOne({ hash }, { hash, accountAddress, nftAddress, nftId, price }, { upsert: true });
    } catch(error) {
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });
}
