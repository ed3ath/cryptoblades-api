const { getCharacterNameFromSeed } = require('../helpers/char-name');

exports.route = (app) => {
  app.get('/static/character/name/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Invalid query. Must pass id.' });
    }

    return res.json({ name: getCharacterNameFromSeed(id) });
  });
};
