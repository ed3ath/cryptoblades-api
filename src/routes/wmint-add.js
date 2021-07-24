const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/weapon/mint/add', async (req, res) => {
    const {
      hash, accountAddress, weaponId, gas, stars
    } = req.query;
    if (!hash || !accountAddress || !weaponId || !stars) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, weaponId, stars.' });
    }

    try {
      await DB.$wmints.replaceOne({ hash }, {
        hash, accountAddress, weaponId, gas, stars
      }, { upsert: true });
    } catch (error) {
      return res.status(500).json({ error });
    }

    return res.json({ added: true });
  });
};
