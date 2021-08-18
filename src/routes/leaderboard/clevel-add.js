const { DB } = require('../../db');

exports.route = (app) => {
  app.post('/leaderboard/character/level/add', async (req, res) => {
    const {
      hash, accountAddress, charId, level, gas,
    } = req.body;
    if (!hash || !accountAddress || !charId || !level) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, charId.' });
    }

    try {
      await DB.$clevels.replaceOne({ hash }, {
        hash, accountAddress, charId, level: +level, gas,
      }, { upsert: true });
    } catch (error) {
      return res.status(500).json({ error });
    }

    return res.json({ added: true });
  });
};
