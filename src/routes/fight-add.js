
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/fight/add', async (req, res) => {

    const { timestamp, blockNumber, transactionHash, accountAddress, characterId, characterLevel, weaponId, weaponData, enemyId, wonFight, enemyRoll, playerRoll, xpGain, skillGain } = req.query;
    if(!timestamp || !blockNumber || !transactionHash || !accountAddress || !characterId || !characterLevel || !weaponId || !weaponDAta || !enemyId || !wonFight || !enemyRoll || !playerRoll || !xpGain || !skillGain) {
      return res.status(400).json({ error: 'Invalid query. Must pass timestamp, blockNumber, transactionHash, accountAddress, characterId, characterLevel, weaponId, weaponData, enemyId, wonFight, enemyRoll, playerRoll, xpGain, skillGain.' });
    }

    DB.$fights.insertOne({ timestamp, blockNumber, transactionHash, accountAddress, characterId, characterLevel, weaponId, weaponData, enemyId, wonFight, enemyRoll, playerRoll, xpGain, skillGain });

    res.json({ added: true });
    
  });
}
