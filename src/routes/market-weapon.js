
const { DB } = require('../db');

exports.route = (app) => {
  app.get('/static/market/weapon', async (req, res) => {

    // clean incoming params
    let { element, minStars, maxStars, sortBy, sortDir, pageSize, pageNum, sellerAddress } = req.query;
    
    element = element || '';
    sellerAddress = sellerAddress || '';
    
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
    const query = { };

    if(element) query.weaponElement = element;
    if(sellerAddress) query.sellerAddress = sellerAddress;
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
      const resultsCursor = await DB.$marketWeapons.find(
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

  app.put('/market/weapon/:weaponId', async (req, res) => {

    const { weaponId } = req.params;
    const { price, weaponStars, weaponElement, stat1Element, stat1Value, stat2Element, stat2Value, stat3Element, stat3Value, timestamp, sellerAddress } = req.body;

    if(!price || !weaponId || !weaponStars || !weaponElement || !stat1Element || !stat1Value || !timestamp || !sellerAddress) {
      return res.status(400).json({ error: 'Invalid body. Must pass price, weaponId, weaponStars, weaponElement, stat1Element, stat1Value, timestamp, sellerAddress.' });
    }

    try {
      await DB.$marketWeapons.replaceOne({ weaponId }, { price, weaponId, weaponStars, weaponElement, stat1Element, stat1Value, stat2Element, stat2Value, stat3Element, stat3Value, timestamp, sellerAddress }, { upsert: true });
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error })
    }

    res.json({ added: true });
    
  });

  app.get('/market/weapon/:weaponId/sell', async (req, res) => {

    const { weaponId } = req.params;

    if(!weaponId) {
      return res.status(400).json({ error: 'Invalid weaponId.' });
    }

    try {
      const currentMarketEntry = await DB.$marketWeapons.findOne({ weaponId });
      if(currentMarketEntry) {
        await DB.$marketSales.insert({ type: 'weapon', ...currentMarketEntry });
      }
        
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error })
    }

    res.json({ sold: true });

  });

  app.delete('/market/weapon/:weaponId', async (req, res) => {

    const { weaponId } = req.params;

    if(!weaponId) {
      return res.status(400).json({ error: 'Invalid weaponId.' });
    }

    try {
      await DB.$marketWeapons.removeOne({ weaponId });
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error })
    }

    res.json({ deleted: true });
    
  });
}
