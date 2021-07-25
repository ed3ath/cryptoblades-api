const { DB } = require('../db');

exports.route = (app) => {
  app.get('/static/fights/:accountAddress', async (req, res) => {
    const { accountAddress } = req.params;
    let { pageSize, pageNum } = req.query;

    if (!accountAddress) {
      return res
        .status(400)
        .json({ error: 'Invalid query. Must pass account address.' });
    }

    if (pageSize) pageSize = +pageSize;
    pageSize = pageSize || 60;
    pageSize = Math.min(pageSize, 60);

    if (pageNum) pageNum = +pageNum;
    pageNum = pageNum || 0;

    // build options
    const options = {
      skip: pageSize * pageNum,
      limit: pageSize,
    };

    try {
      const resultsCursor = await DB.$fights.find({ accountAddress }, options);

      const results = await resultsCursor.toArray();

      return res.json({
        results,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error });
    }
  });
};
