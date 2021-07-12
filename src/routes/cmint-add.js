
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/character/mint/add', async (req, res) => {

    const { hash, accountAddress, charId, gas } = req.query;
    if(!hash || !accountAddress || !charId) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, charId.' });
    }

    try {
      await DB.$cmints.replaceOne({ hash }, { hash, accountAddress, charId, gas }, { upsert: true });
    } catch(error) {
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });
}
