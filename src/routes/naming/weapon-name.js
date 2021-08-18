const { getWeaponNameFromSeed } = require('../../helpers/weapon-name');

exports.route = (app) => {
  app.get('/static/weapon/name/:id/:stars', async (req, res) => {
    const { id, stars } = req.params;
    if (!id || !stars) {
      return res.status(400).json({ error: 'Invalid query. Must pass id/stars.' });
    }

    return res.json({ name: getWeaponNameFromSeed(id, +stars) });
  });
};
