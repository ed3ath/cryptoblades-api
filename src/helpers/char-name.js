
const names = require('../data/char-names.json');
const seedrandom = require('seedrandom');

const getRandom = (rng, arr) => arr[Math.floor(rng() * arr.length)];

exports.getCharacterNameFromSeed = (seed) => {
  const rng = seedrandom(seed.toString());

  const firstKey = getRandom(rng, ['one', 'two', 'three', 'more']);
  const secondKey = getRandom(rng, ['one', 'two', 'three', 'more']);

  const firstName = getRandom(rng, names[firstKey]);
  const secondName = getRandom(rng, names[secondKey]);

  return `${firstName} ${secondName}`;
};