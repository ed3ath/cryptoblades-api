
const { DB } = require('../db');

const { getCharacterNameFromSeed } = require('../helpers/char-name');

const LEADERBOARD_MAX = 25;

const getFightWinLeaderboard = async () => {
  const fightWinLeaderboard = await DB.$fights.aggregate([
    { $match: { wonFight: 'true' } },

    { $group: { _id: '$characterId', count: { $sum: 1 } } },

    { $sort: { count: -1 } },

    { $limit: LEADERBOARD_MAX }
  ]).toArray();

  return fightWinLeaderboard.map(x => ({
    name: `${getCharacterNameFromSeed(x._id)} (ID ${x._id})`,
    value: x.count,
    characterId: x._id
  }));
};

const getFightLossLeaderboard = async () => {
  const fightLossLeaderboard = await DB.$fights.aggregate([
    { $match: { wonFight: 'false' } },

    { $group: { _id: '$characterId', count: { $sum: 1 } } },

    { $sort: { count: -1 } },

    { $limit: LEADERBOARD_MAX }
  ]).toArray();

  return fightLossLeaderboard.map(x => ({
    name: `${getCharacterNameFromSeed(x._id)} (ID ${x._id})`,
    value: x.count,
    characterId: x._id
  }));
};

const getForges = async () => {
  const forgeLeaderboard = await DB.$wmints.aggregate([
    { $group: { _id: '$accountAddress', count: { $sum: 1 } } },

    { $sort: { count: -1 } },

    { $limit: LEADERBOARD_MAX }
  ]).toArray();

  return forgeLeaderboard.map(x => ({
    name: x._id,
    value: x.count
  }));
};

const getReforges = async () => {
  const reforgeLeaderboard = await DB.$reforges.aggregate([
    { $group: { _id: '$accountAddress', count: { $sum: 1 } } },

    { $sort: { count: -1 } },

    { $limit: LEADERBOARD_MAX }
  ]).toArray();

  return reforgeLeaderboard.map(x => ({
    name: x._id,
    value: x.count
  }));
};

exports.duration = process.env.NODE_ENV === 'production' ? 900 :  5;

exports.task = async () => {

  // do fight win update
  const fightWins = await getFightWinLeaderboard();

  await DB.$leaderboard.replaceOne(
    { key: 'Fights Won' }, 
    { key: 'Fights Won', units: 'Won', leaderboard: fightWins }, 
    { upsert: true }
  );

  // do fight loss update
  const fightLosses = await getFightLossLeaderboard();

  await DB.$leaderboard.replaceOne(
    { key: 'Fights Lost' }, 
    { key: 'Fights Lost', units: 'Lost', leaderboard: fightLosses }, 
    { upsert: true }
  );

  // count forges
  const forges = await getForges();

  await DB.$leaderboard.replaceOne(
    { key: 'Weapons Forged' }, 
    { key: 'Weapons Forged', units: 'Forged', leaderboard: forges }, 
    { upsert: true }
  );

  // count reforges
  const reforges = await getReforges();

  await DB.$leaderboard.replaceOne(
    { key: 'Weapon Reforges' }, 
    { key: 'Weapon Reforges', units: 'Reforged', leaderboard: reforges }, 
    { upsert: true }
  );

};