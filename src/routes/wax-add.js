
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/wax/add', async (req, res) => {

    const { waxWallet, bscWallet, waxAmount, waxChainTransactionId, waxChainBlockNumber, bscTransactionId } = req.query;
    if(!waxWallet || !waxAmount || !waxChainTransactionId || !waxChainBlockNumber || !bscTransactionId) {
      return res.status(400).json({ error: 'Invalid query. Must pass waxWallet, waxAmount, waxChainTransactionId, waxChainBlockNumber, bscTransactionId.' });
    }

    DB.$log.insertOne({ waxWallet, bscWallet, waxAmount, waxChainTransactionId, waxChainBlockNumber, bscTransactionId });

    res.json({ added: true });
    
  });
}
