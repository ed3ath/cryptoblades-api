const banned = require('../../banned.json');

exports.route = (app) => {
  app.get('/static/wallet/banned/:walletAddress', async (req, res) => {
    const isBanned = banned.includes(req.params.walletAddress);
    return res.send({ banned: isBanned });
  });
};
