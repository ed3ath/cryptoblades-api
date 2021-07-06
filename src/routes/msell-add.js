
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/market/sell/add', async (req, res) => {

    const { hash, accountAddress, buyerAddress, nftAddress, nftId, price } = req.query;
    if(!hash || !accountAddress || !buyerAddress || !nftAddress || !nftId || !price) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, buyerAddress, nftAddress, nftId, price.' });
    }

    DB.$marketlists.insertOne({ hash, accountAddress, buyerAddress, nftAddress, nftId, price });

    res.json({ added: true });
    
  });
}
