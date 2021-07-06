
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/weapon/reforge/add', async (req, res) => {

    const { hash, accountAddress, weaponId, burnId } = req.query;
    if(!hash || !accountAddress || !weaponId || !burnId) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, weaponId, burnId.' });
    }

    DB.$reforges.insertOne({ hash, accountAddress, weaponId, burnId });

    res.json({ added: true });
    
  });
}
