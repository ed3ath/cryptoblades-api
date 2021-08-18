const { DB } = require('../../db');
const { redis } = require('../../helpers/redis-helper');

exports.route = (app) => {
  app.get('/static/market/character', async (req, res) => {
    // clean incoming params
    let {
      element, minLevel, maxLevel, sortBy, sortDir, pageSize, pageNum, sellerAddress, buyerAddress,
      minPrice, maxPrice, network,
    } = req.query;

    element = element || '';
    sellerAddress = sellerAddress || '';
    buyerAddress = buyerAddress || '';
    network = network || 'bsc';

    if (minLevel) minLevel = +minLevel;
    minLevel = minLevel || 1;

    if (maxLevel) maxLevel = +maxLevel;
    maxLevel = maxLevel || 101;

    if (minPrice) minPrice = +minPrice;
    minPrice = Math.max(minPrice, 0);

    if (maxPrice) maxPrice = +maxPrice;
    maxPrice = Math.max(maxPrice, 0);

    sortBy = sortBy || 'timestamp';

    if (sortDir) sortDir = +sortDir;
    sortDir = sortDir || -1;

    if (pageSize) pageSize = +pageSize;
    pageSize = pageSize || 60;
    pageSize = Math.max(1, Math.min(pageSize, 60));

    if (pageNum) pageNum = +pageNum;
    pageNum = pageNum || 0;

    // build a query
    const query = { };

    if (network) query.network = network;
    if (element) query.charElement = element;
    if (sellerAddress) query.sellerAddress = sellerAddress;
    if (buyerAddress) query.buyerAddress = buyerAddress;
    if (!buyerAddress) query.buyerAddress = { $eq: null };
    if (minLevel || maxLevel) {
      query.charLevel = {};
      if (minLevel) query.charLevel.$gte = minLevel;
      if (maxLevel) query.charLevel.$lte = maxLevel;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    // build options
    const options = {
      skip: pageSize * pageNum,
      limit: pageSize,
    };

    if (sortBy && sortDir) {
      options.sort = { [sortBy]: sortDir };
    }

    const cacheKey = `${JSON.stringify(query)}-${JSON.stringify(options)}`;

    // only unauthenticated requests hit redis
    if (redis && !req.isAuthenticated) {
      const cached = await redis.exists(`mchar-${cacheKey}`);
      if (cached) {
        const dataRedis = await redis.get(`mchar-${cacheKey}`);
        const data = JSON.parse(dataRedis);
        if (data && data.results && data.results.length > 0) {
          res.json(data);
          return;
        }
      }
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
        idResults: results.map((x) => x.charId),
        page: {
          curPage: pageNum,
          curOffset: pageNum * pageSize,
          total: totalDocuments,
          pageSize,
          numPages,
        },
      };

      res.json(resData);

      if (redis) redis.set(`mchar-${cacheKey}`, JSON.stringify(resData), 'ex', 450);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error });
    }
  });

  app.put('/market/character/:network/:charId', async (req, res) => {
    const { charId, network } = req.params;
    const {
      price, charLevel, charElement, timestamp, sellerAddress, buyerAddress,
    } = req.body;

    if (!price || !charId || !charLevel || !charElement || !timestamp || !sellerAddress || !network) {
      return res.status(400).json({ error: 'Invalid body. Must pass price, charId, charLevel, charElement, timestamp, sellerAddress, network.' });
    }

    try {
      await DB.$marketCharacters.replaceOne({ charId }, {
        price, charId, charLevel, charElement, timestamp, sellerAddress, buyerAddress, network,
      }, { upsert: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }

    return res.json({ added: true });
  });

  app.get('/market/character/:network/:charId/sell', async (req, res) => {
    const { charId, network } = req.params;

    if (!charId || !network) {
      return res.status(400).json({ error: 'Invalid charId or network.' });
    }

    try {
      const currentMarketEntry = await DB.$marketCharacters.findOne({ charId, network });
      if (currentMarketEntry) {
        const { _id, ...character } = currentMarketEntry;
        await DB.$marketSales.insert({ type: 'character', character });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }

    return res.json({ sold: true });
  });

  app.delete('/market/character/:network/:charId', async (req, res) => {
    const { charId, network } = req.params;

    if (!charId || !network) {
      return res.status(400).json({ error: 'Invalid charId or network.' });
    }

    try {
      await DB.$marketCharacters.removeOne({ charId, network });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }

    return res.json({ deleted: true });
  });

  app.delete('/market/character/all/:sellerAddress', async (req, res) => {
    const { sellerAddress } = req.params;

    if (!sellerAddress) {
      return res.status(400).json({ error: 'Invalid address.' });
    }

    try {
      await DB.$marketWeapons.remove({ sellerAddress });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }

    return res.json({ deleted: true });
  });
};
