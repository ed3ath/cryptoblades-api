
const { DB } = require('../db');

const { getCharacterNameFromSeed } = require('../helpers/char-name');

exports.duration = process.env.NODE_ENV === 'production' ? 900 :  5;

const getFightWinLeaderboard = async () => {
  const fightWinLeaderboard = await DB.$fights.aggregate([
    { $match: { wonFight: 'true' } },

    { $group: { _id: '$characterId', count: { $sum: 1 } } },

    { $sort: { count: -1 } },

    { $limit: 10 }
  ]).toArray();

  return fightWinLeaderboard.map(x => ({
    name: `${getCharacterNameFromSeed(x._id)} (ID ${x._id})`,
    value: x.count
  }));
};

exports.task = async () => {
  const fightWins = await getFightWinLeaderboard();

  await DB.$leaderboard.replaceOne(
    { key: 'Fights Won' }, 
    { key: 'Fights Won', units: 'Won', leaderboard: fightWins }, 
    { upsert: true }
  );
};