
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/market/sell/add', async (req, res) => {

    const { hash, accountAddress, buyerAddress, nftAddress, nftId, price } = req.query;
    if(!hash || !accountAddress || !buyerAddress || !nftAddress || !nftId || !price) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, buyerAddress, nftAddress, nftId, price.' });
    }

    try {
      await DB.$marketlists.replaceOne({ hash }, { hash, accountAddress, buyerAddress, nftAddress, nftId, price }, { upsert: true });
    } catch(error) {
      return res.status(400).json({ error })
    }

    res.json({ added: true });
    
  });
}
