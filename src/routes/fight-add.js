
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/fight/add', async (req, res) => {

    const { hash, accountAddress, characterId, characterLevel, weaponId, enemyId, wonFight, enemyRoll, playerRoll, xpGain, skillGain } = req.query;
    if(!hash || !accountAddress || !characterId || !characterLevel || !weaponId || !enemyId || !wonFight || !enemyRoll || !playerRoll || !xpGain || !skillGain) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, characterId, characterLevel, weaponId, weaponData, enemyId, wonFight, enemyRoll, playerRoll, xpGain, skillGain.' });
    }

    try {
      await DB.$fights.insertOne({ hash, accountAddress, characterId, characterLevel, weaponId, weaponData, enemyId, wonFight, enemyRoll, playerRoll, xpGain, skillGain });
    } catch(error) {
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });
}
