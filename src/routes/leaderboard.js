
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/static/leaderboard', async (req, res) => {
    const allLeaderboard = await DB.$leaderboard.find();
    const leaderboard = await allLeaderboard.toArray();

    res.json({ leaderboard });
  });
}
