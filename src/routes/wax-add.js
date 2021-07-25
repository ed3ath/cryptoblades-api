const { DB } = require('../db');

exports.route = (app) => {
  app.get('/wax/add', async (req, res) => {
    const {
      waxWallet, bscWallet, waxAmount, waxChainTransactionId,
      waxChainBlockNumber, bscTransactionId, failureReason, gas,
    } = req.query;
    if (!waxWallet || !waxAmount || !waxChainTransactionId
     || !waxChainBlockNumber || !bscTransactionId) {
      return res.status(400).json({
        error: 'Invalid query. Must pass waxWallet, waxAmount, waxChainTransactionId, waxChainBlockNumber, bscTransactionId.',
      });
    }

    try {
      await DB.$log.insertOne({
        waxWallet,
        bscWallet,
        waxAmount,
        waxChainTransactionId,
        waxChainBlockNumber,
        bscTransactionId,
        failureReason,
        gas,
      });
    } catch (error) {
      return res.status(500).json({ error });
    }

    return res.json({ added: true });
  });
};
