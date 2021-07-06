
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/weapon/mint/add', async (req, res) => {

    const { hash, accountAddress, weaponId } = req.query;
    if(!hash || !accountAddress || !weaponId) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, weaponId.' });
    }

    DB.$wmints.insertOne({ hash, accountAddress, weaponId });

    res.json({ added: true });
    
  });
}
