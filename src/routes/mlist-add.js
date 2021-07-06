
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/market/list/add', async (req, res) => {

    const { hash, accountAddress, nftAddress, nftId, price } = req.query;
    if(!hash || !accountAddress || !nftAddress || !nftId || !price) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, nftAddress, nftId, price.' });
    }

    try {
      await DB.$marketlists.insertOne({ hash, accountAddress, nftAddress, nftId, price });
    } catch(error) {
      return res.status(400).json({ error })
    }

    res.json({ added: true });
    
  });
}
