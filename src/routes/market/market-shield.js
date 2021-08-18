const { DB } = require('../../db');
const { redis } = require('../../helpers/redis-helper');

exports.route = (app) => {
  app.get('/static/market/shield', async (req, res) => {
    // clean incoming params
    let {
      element, minStars, maxStars, sortBy, sortDir, pageSize, pageNum, sellerAddress, buyerAddress,
      minPrice, maxPrice, network,
    } = req.query;

    element = element || '';
    sellerAddress = sellerAddress || '';
    buyerAddress = buyerAddress || '';
    network = network || 'bsc';

    if (minPrice) minPrice = +minPrice;
    minPrice = Math.max(minPrice, 0);

    if (maxPrice) maxPrice = +maxPrice;
    maxPrice = Math.max(maxPrice, 0);

    if (minStars) minStars = +minStars;
    minStars = minStars || 1;

    if (maxStars) maxStars = +maxStars;
    maxStars = maxStars || 5;

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
    if (element) query.shieldElement = element;
    if (sellerAddress) query.sellerAddress = sellerAddress;
    if (buyerAddress) query.buyerAddress = buyerAddress;
    if (!buyerAddress) query.buyerAddress = { $eq: null };
    if (minStars || maxStars) {
      query.shieldStars = {};
      if (minStars) query.shieldStars.$gte = minStars;
      if (maxStars) query.shieldStars.$lte = maxStars;
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
      const cached = await redis.exists(`mshield-${cacheKey}`);
      if (cached) {
        const dataRedis = await redis.get(`mshield-${cacheKey}`);
        const data = JSON.parse(dataRedis);
        if (data && data.results && data.results.length > 0) {
          res.json(data);
          return;
        }
      }
    }

    // get and send results
    try {
      const resultsCursor = await DB.$marketShields.find(query, options);
      const allResultsCursor = await DB.$marketShields.find(query);

      const results = await resultsCursor.toArray();

      const totalDocuments = await allResultsCursor.count();
      const numPages = Math.floor(totalDocuments / pageSize);

      const resData = {
        results,
        idResults: results.map((x) => x.shieldId),
        page: {
          curPage: pageNum,
          curOffset: pageNum * pageSize,
          total: totalDocuments,
          pageSize,
          numPages,
        },
      };

      res.json(resData);

      if (redis) redis.set(`mshield-${cacheKey}`, JSON.stringify(resData), 'ex', 450);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error });
    }
  });

  app.put('/market/shield/:network/:shieldId', async (req, res) => {
    const { shieldId, network } = req.params;
    const {
      price, shieldStars, shieldElement, stat1Element, stat1Value,
      stat2Element, stat2Value, stat3Element, stat3Value, timestamp, sellerAddress, buyerAddress,
    } = req.body;

    if (!price || !shieldId || !shieldStars || !shieldElement || !stat1Element
     || !stat1Value || !timestamp || !sellerAddress || !network) {
      return res.status(400).json({
        error: 'Invalid body. Must pass price, shieldId, shieldStars, shieldElement, stat1Element, stat1Value, timestamp, sellerAddress, network.',
      });
    }

    try {
      await DB.$marketShields.replaceOne({ shieldId, network }, {
        price,
        shieldId,
        shieldStars,
        shieldElement,
        stat1Element,
        stat1Value,
        stat2Element,
        stat2Value,
        stat3Element,
        stat3Value,
        timestamp,
        sellerAddress,
        buyerAddress,
        network,
      }, { upsert: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }

    return res.json({ added: true });
  });

  app.get('/market/shield/:network/:shieldId/sell', async (req, res) => {
    const { shieldId, network } = req.params;

    if (!shieldId || !network) {
      return res.status(400).json({ error: 'Invalid shieldId or network.' });
    }

    try {
      const currentMarketEntry = await DB.$marketShields.findOne({ shieldId, network });
      if (currentMarketEntry) {
        const { _id, ...shield } = currentMarketEntry;
        await DB.$marketSales.insert({ type: 'shield', shield });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }

    return res.json({ sold: true });
  });

  app.delete('/market/shield/:network/:shieldId', async (req, res) => {
    const { shieldId, network } = req.params;

    if (!shieldId || !network) {
      return res.status(400).json({ error: 'Invalid shieldId or network.' });
    }

    try {
      await DB.$marketShields.removeOne({ shieldId, network });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }

    return res.json({ deleted: true });
  });

  app.delete('/market/shield/all/:sellerAddress', async (req, res) => {
    const { sellerAddress } = req.params;

    if (!sellerAddress) {
      return res.status(400).json({ error: 'Invalid address.' });
    }

    try {
      await DB.$marketShields.remove({ sellerAddress });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }

    return res.json({ deleted: true });
  });
};
