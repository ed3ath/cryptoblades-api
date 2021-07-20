
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/static/calculated/skill/contract', async (req, res) => {
    const data = await DB.$dataPoints.findOne({ type: 'contract' }, { sort: { timestamp: -1 } });
    if(!data) return res.write('' + 603515);

    return res.send('' + data.total);
  });

  app.post('/calculated/skill/contract', async (req, res) => {
    
    const { total } = req.body;
    let { timestamp } = req.body;

    if(!total) {
      return res.status(400).json({ error: 'Invalid body. Must pass total.' });
    }

    if(!timestamp) timestamp = Date.now();

    DB.$dataPoints.insert({ type: 'contract', total, timestamp });

    return res.json({ added: true });
  });
}
