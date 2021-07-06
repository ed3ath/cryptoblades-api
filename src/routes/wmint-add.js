
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/weapon/mint/add', async (req, res) => {

    const { hash, accountAddress, weaponId } = req.query;
    if(!hash || !accountAddress || !weaponId) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, weaponId.' });
    }

    try {
      await DB.$wmints.insertOne({ hash, accountAddress, weaponId });
    } catch(error) {
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });
}
