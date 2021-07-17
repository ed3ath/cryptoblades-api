
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/market/weapon', async (req, res) => {

    // clean incoming params
    let { element, minStars, maxStars, sortBy, sortDir, pageSize, pageNum } = req.query;
    
    element = element || '';
    
    if(minStars) minStars = +minStars;
    minStars = minStars || 1;

    if(maxStars) maxStars = +maxStars;
    maxStars = maxStars || 5;

    sortBy = sortBy || 'timestamp';

    if(sortDir) sortDir = +sortDir;
    sortDir = sortDir || -1;

    if(pageSize) pageSize = +pageSize;
    pageSize = pageSize || 60;

    if(pageNum) pageNum = +pageNum;
    pageNum = pageNum || 0;

    // build a query
    const query = { type: 'weapon' };

    if(element) query.weaponElement = element;
    if(minStars || minStars) {
      query.weaponStars = {};
      if(minStars) query.weaponStars.$gte = minStars;
      if(maxStars) query.weaponStars.$lte = maxStars;
    }

    // build options
    const options = {
      skip: pageSize * pageNum,
      limit: pageSize
    };

    if(sortBy && sortDir) {
      options.sort = { [sortBy]: sortDir };
    }

    // get and send results
    try {
      const resultsCursor = await DB.$market.find(
        query,
        options
      );
  
      const results = await resultsCursor.toArray();

      res.json({ 
        results,
        page: {
          curPage: pageNum,
          curOffset: pageNum * pageSize,
          pageSize: pageSize,
        }  
      });
    } catch(error) {

      console.error(error);
      return res.status(500).json({ error })

    }
    
  });

  app.put('/market/weapon/:hash', async (req, res) => {

    const { hash } = req.params;
    const { price, weaponId, weaponStars, weaponElement, timestamp } = req.body;

    if(!hash || !price || !weaponId || !weaponStars || !weaponElement || !timestamp) {
      return res.status(400).json({ error: 'Invalid body. Must pass hash, price, weaponId, weaponStars, weaponElement, timestamp.' });
    }

    try {
      await DB.$market.replaceOne({ hash }, { type: 'weapon', hash, price, weaponId, weaponStars, weaponElement, timestamp }, { upsert: true });
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });

  app.delete('/market/weapon/:hash', async (req, res) => {

    const { hash } = req.params;

    if(!hash) {
      return res.status(400).json({ error: 'Invalid hash.' });
    }

    try {
      await DB.$market.removeOne({ hash });
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error })
    }

    res.json({ deleted: true });
    
  });
}
