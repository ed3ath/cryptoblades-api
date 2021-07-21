
const { DB } = require('../db');
const { redis } = require('../helpers/redis-helper');

exports.route = (app) => {
  app.get('/static/market/character', async (req, res) => {
    
    if(redis) {
      const cached = await redis.exists(`mchar-${req.url}`);
      if(cached) {
        const dataRedis = await redis.get(`mchar-${req.url}`);
        const data = JSON.parse(dataRedis);
        if(data && data.results && data.results.length > 0) {
          res.json(data);
          return;
        }
      }
    }

    // clean incoming params
    let { element, minLevel, maxLevel, sortBy, sortDir, pageSize, pageNum, sellerAddress, buyerAddress } = req.query;
    
    element = element || '';
    sellerAddress = sellerAddress || '';
    buyerAddress = buyerAddress || '';
    
    if(minLevel) minLevel = +minLevel;
    minLevel = minLevel || 1;

    if(maxLevel) maxLevel = +maxLevel;
    maxLevel = maxLevel || 101;

    sortBy = sortBy || 'timestamp';

    if(sortDir) sortDir = +sortDir;
    sortDir = sortDir || -1;

    if(pageSize) pageSize = +pageSize;
    pageSize = pageSize || 60;
    pageSize = Math.min(pageSize, 60);

    if(pageNum) pageNum = +pageNum;
    pageNum = pageNum || 0;

    // build a query
    const query = { };

    if(element) query.charElement = element;
    if(sellerAddress) query.sellerAddress = sellerAddress;
    if(buyerAddress) query.buyerAddress = buyerAddress;
    if(!buyerAddress) query.buyerAddress = { $eq: null };
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
      const resultsCursor = await DB.$marketCharacters.find(query, options);
      const allResultsCursor = await DB.$marketCharacters.find(query);
  
      const results = await resultsCursor.toArray();

      const totalDocuments = await allResultsCursor.count();
      const numPages = Math.floor(totalDocuments / pageSize);

      const resData = { 
        results,
        idResults: results.map(x => x.charId),
        page: {
          curPage: pageNum,
          curOffset: pageNum * pageSize,
          total: totalDocuments,
          pageSize,
          numPages
        }  
      };

      res.json(resData);

      if(redis) redis.set(`mchar-${req.url}`, JSON.stringify(resData));
    } catch(error) {

      console.error(error);
      return res.status(500).json({ error });

    }
    
  });

  app.put('/market/character/:charId', async (req, res) => {

    const { charId } = req.params;
    const { price, charLevel, charElement, timestamp, sellerAddress, buyerAddress } = req.body;

    if(!price || !charId || !charLevel || !charElement || !timestamp || !sellerAddress) {
      return res.status(400).json({ error: 'Invalid body. Must pass price, charId, charLevel, charElement, timestamp, sellerAddress.' });
    }

    try {
      await DB.$marketCharacters.replaceOne({ charId }, { price, charId, charLevel, charElement, timestamp, sellerAddress, buyerAddress }, { upsert: true });
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });

  app.get('/market/character/:charId/sell', async (req, res) => {

    const { charId } = req.params;

    if(!charId) {
      return res.status(400).json({ error: 'Invalid charId.' });
    }

    try {
      const currentMarketEntry = await DB.$marketCharacters.findOne({ charId });
      if(currentMarketEntry) {
        await DB.$marketSales.insert({ type: 'character', ...currentMarketEntry });
      }
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error })
    }

    res.json({ sold: true });

  });

  app.delete('/market/character/:charId', async (req, res) => {

    const { charId } = req.params;

    if(!charId) {
      return res.status(400).json({ error: 'Invalid charId.' });
    }

    try {
      await DB.$marketCharacters.removeOne({ charId });
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error })
    }

    res.json({ deleted: true });
    
  });
}
