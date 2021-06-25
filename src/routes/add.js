
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/add-transaction', async (req, res) => {

    const { waxWallet, bscWallet, waxAmount } = req.query;
    if(!waxWallet || !bscWallet || !waxAmount) {
      return res.status(400).json({ error: 'Invalid query. Must pass waxWallet, bscWallet, waxAmount.' });
    }

    DB.$log.insertOne({ waxWallet, bscWallet, waxAmount });
    DB.$transfers.insertOne({ waxWallet, bscWallet, waxAmount });

    res.json({ added: true });
    
  });
}