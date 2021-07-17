
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/market/character', async (req, res) => {

    // clean incoming params
    let { element, minLevel, maxLevel, sortBy, sortDir, pageSize, pageNum } = req.query;
    
    element = element || '';
    
    if(minLevel) minLevel = +minLevel;
    minLevel = minLevel || 1;

    if(maxLevel) maxLevel = +maxLevel;
    maxLevel = maxLevel || 101;

    sortBy = sortBy || 'timestamp';

    if(sortDir) sortDir = +sortDir;
    sortDir = sortDir || -1;

    if(pageSize) pageSize = +pageSize;
    pageSize = pageSize || 60;

    if(pageNum) pageNum = +pageNum;
    pageNum = pageNum || 0;

    // build a query
    const query = { type: 'character' };

    if(element) query.charElement = element;
    if(minLevel || maxLevel) {
      query.charLevel = {};
      if(minLevel) query.charLevel.$gte = minLevel;
      if(maxLevel) query.charLevel.$lte = maxLevel;
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

  app.put('/market/character/:hash', async (req, res) => {

    const { hash } = req.params;
    const { price, charId, charLevel, charElement, timestamp } = req.body;

    if(!hash || !price || !charId || !charLevel || !charElement || !timestamp) {
      return res.status(400).json({ error: 'Invalid body. Must pass hash, price, charId, charLevel, charElement, timestamp.' });
    }

    try {
      await DB.$market.replaceOne({ hash }, { type: 'character', hash, price, charId, charLevel, charElement, timestamp }, { upsert: true });
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });

  app.delete('/market/character/:hash', async (req, res) => {

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
