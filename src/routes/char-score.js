
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/static/character/score/:id', async (req, res) => {

    const { id } = req.params;
    if(!id) {
      return res.status(400).json({ error: 'Invalid query. Must pass id.' });
    }
    
    const allFightsRes = await DB.$fights.find({ characterId: id });
    const allFights = await allFightsRes.toArray();

    const numWon = allFights.filter(x => x.wonFight === 'true').length;

    const comparator = Math.max(0, numWon - (allFights.length - numWon)); 

    let score = Math.min(comparator, 5);

    const chunks = [
      { max: 5,    mult: 1 },
      { max: 15,   mult: 2 },
      { max: 35,   mult: 3 },
      { max: 65,   mult: 4 },
      { max: 100,  mult: 5 },
      { max: 160,  mult: 6 },
      { max: 250,  mult: 7 },
      { max: 500,  mult: 8 },
      { max: 1000, mult: 9 },
      { max: 2500, mult: 10 },
    ];

    chunks.forEach(({ max, mult }) => {
      if(comparator < max) return;
      score += mult * comparator;
    });

    res.json({ score });
  });
}
