
const names = require('../data/char-names.json');
const seedrandom = require('seedrandom');

const getRandom = (rng, arr) => arr[Math.floor(rng() * arr.length)];

const getCharacterNameFromSeed = (seed) => {
  const rng = seedrandom(seed.toString());

  const firstKey = getRandom(rng, ['one', 'two', 'three', 'more']);
  const secondKey = getRandom(rng, ['one', 'two', 'three', 'more']);

  const firstName = getRandom(rng, names[firstKey]);
  const secondName = getRandom(rng, names[secondKey]);

  return `${firstName} ${secondName}`;
};

exports.route = (app) => {
  app.get('/character/name/:id', async (req, res) => {

    const { id } = req.params;
    if(!id) {
      return res.status(400).json({ error: 'Invalid query. Must pass id.' });
    }
    
    res.json({ name: getCharacterNameFromSeed(id) });
  });
}
