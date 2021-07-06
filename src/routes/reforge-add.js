
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/weapon/reforge/add', async (req, res) => {

    const { hash, accountAddress, weaponId, burnId } = req.query;
    if(!hash || !accountAddress || !weaponId || !burnId) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, weaponId, burnId.' });
    }

    try {
      await DB.$reforges.insertOne({ hash, accountAddress, weaponId, burnId });
    } catch(error) {
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });
}
