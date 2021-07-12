
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/weapon/mint/add', async (req, res) => {

    const { hash, accountAddress, weaponId, gas } = req.query;
    if(!hash || !accountAddress || !weaponId) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, weaponId.' });
    }

    try {
      await DB.$wmints.replaceOne({ hash }, { hash, accountAddress, weaponId, gas }, { upsert: true });
    } catch(error) {
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });
}
