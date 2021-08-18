const { DB } = require('../../db');

exports.route = (app) => {
  app.post('/leaderboard/character/mint/add', async (req, res) => {
    const {
      hash, accountAddress, charId, gas,
    } = req.body;
    if (!hash || !accountAddress || !charId) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, charId.' });
    }

    try {
      await DB.$cmints.replaceOne({ hash }, {
        hash, accountAddress, charId, gas,
      }, { upsert: true });
    } catch (error) {
      return res.status(500).json({ error });
    }

    return res.json({ added: true });
  });
};
