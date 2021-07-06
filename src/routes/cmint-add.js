
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/character/mint/add', async (req, res) => {

    const { hash, accountAddress, charId } = req.query;
    if(!hash || !accountAddress || !charId) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, charId.' });
    }

    try {
      await DB.$cmints.insertOne({ hash, accountAddress, charId });
    } catch(error) {
      return res.status(400).json({ error })
    }

    res.json({ added: true });
    
  });
}
