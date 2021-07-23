const { DB } = require('../db');

exports.route = (app) => {
  app.get('/leaderboard/fight/add', async (req, res) => {
    const {
      hash, accountAddress, characterId, characterLevel, weaponId,
      enemyId, wonFight, enemyRoll, playerRoll, xpGain, skillGain, gas,
    } = req.query;
    if (!hash || !accountAddress || !characterId || !characterLevel
     || !weaponId || !enemyId || !wonFight || !enemyRoll || !playerRoll || !xpGain || !skillGain) {
      return res.status(400).json({ error: 'Invalid query. Must pass hash, accountAddress, characterId, characterLevel, weaponId, weaponData, enemyId, wonFight, enemyRoll, playerRoll, xpGain, skillGain.' });
    }

    try {
      await DB.$fights.replaceOne({ hash }, {
        hash,
        accountAddress,
        characterId,
        characterLevel,
        weaponId,
        enemyId,
        wonFight,
        enemyRoll,
        playerRoll,
        xpGain,
        skillGain,
        gas,
      }, { upsert: true });
    } catch (error) {
      return res.status(500).json({ error });
    }

    return res.json({ added: true });
  });
};
