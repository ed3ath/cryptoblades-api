const { DB } = require('../db');

exports.route = (app) => {
  app.post('/leaderboard/weapon/reforge/add', async (req, res) => {
    const {
      hash, accountAddress, weaponId, burnId, gas,
    } = req.body;
    if (!hash || !accountAddress || !weaponId || !burnId) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, weaponId, burnId.' });
    }

    try {
      await DB.$reforges.replaceOne({ hash }, {
        hash, accountAddress, weaponId, burnId, gas,
      }, { upsert: true });
    } catch (error) {
      return res.status(500).json({ error });
    }

    return res.json({ added: true });
  });
};
