
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/character/level/add', async (req, res) => {

    const { hash, accountAddress, charId, level } = req.query;
    if(!hash || !accountAddress || !charId || !level) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, charId.' });
    }

    try {
      await DB.$clevels.insertOne({ hash, accountAddress, charId, level });
    } catch(error) {
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });
}
