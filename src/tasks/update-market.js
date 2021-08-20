const PQueue = require('p-queue');
const pRetry = require('p-retry');

const marketplaceHelper = require('../helpers/marketplace-helper');
const multicall = require('../helpers/multicall');

const { DB } = require('../db');

exports.duration = process.env.NODE_ENV === 'production' ? 1800 : 600;

const ITEMS_PER_PAGE = parseInt(process.env.MARKETPLACE_ITEMS_PAGE, 10) || 2500;
const MAX_ITEMS_PER_UPDATE = parseInt(process.env.MAX_UPDATE, 10) || 500;

exports.task = async () => {
  if (!await marketplaceHelper.init(':Clean-Up')) {
    return;
  }

  const tokenAddresses = [
    marketplaceHelper.getCharactersAddress(),
    marketplaceHelper.getWeaponsAddress(),
    marketplaceHelper.getShieldsAddress(),
  ];

  const processed = {};
  const toProcess = {};

  const queue = new PQueue({ concurrency: 50 });

  const createOrUpdateBatch = async (nftAddress, items) => {
    const collection = marketplaceHelper.getCollection(nftAddress);
    const idKey = marketplaceHelper.getIdKey(nftAddress);

    if (!collection || !idKey) return;

    const multicallData = marketplaceHelper.getNFTDataCall(nftAddress, items.map((item) => item.nftId));

    const data = await pRetry(() => multicall(marketplaceHelper.getWeb3(), multicallData.abi, multicallData.calls), { retries: 5 });

    const bulk = DB[collection].initializeUnorderedBulkOp();

    items.forEach((item, i) => {
      bulk
        .find({ [idKey]: item.nftId })
        .upsert()
        .replaceOne(
          marketplaceHelper.processNFTData(nftAddress, item.nftId, item.price, item.seller, data[i]),
        );
    });

    const bulkResult = await pRetry(() => bulk.execute(), { retries: 5 });

    processed[nftAddress] += bulkResult.nUpserted + bulkResult.nModified;
  };

  const checkToProcess = (address, maxLength) => {
    if (toProcess[address].length > maxLength) {
      const items = [...toProcess[address]];
      toProcess[address] = [];
      queue.add(() => createOrUpdateBatch(address, items));
    }
  };

  tokenAddresses.forEach((address) => {
    toProcess[address] = [];
    processed[address] = 0;

    const runQueue = (start) => async () => {
      const results = await pRetry(() => marketplaceHelper
        .getNftMarketPlace()
        .methods
        .getListingSlice(address, start, ITEMS_PER_PAGE).call(),
      { retries: 5 });

      console.log(
        marketplaceHelper.getTypeName(address),
        processed[address],
        start,
        results.returnedCount,
        ITEMS_PER_PAGE,
      );

      for (let i = 0; results.returnedCount > i; i += 1) {
        toProcess[address].push({
          nftId: results.ids[i],
          price: results.prices[i],
          seller: results.sellers[i],
        });

        checkToProcess(address, MAX_ITEMS_PER_UPDATE);
      }

      if (results.returnedCount >= ITEMS_PER_PAGE) {
        queue.add(runQueue(start + ITEMS_PER_PAGE * 5));
      }
    };

    for (let i = 0; i < 5; i += 1) {
      queue.add(runQueue(ITEMS_PER_PAGE * i));
    }
  });

  await queue.onIdle();

  tokenAddresses.forEach((address) => {
    checkToProcess(address, 0);
  });

  await queue.onIdle();

  tokenAddresses.forEach((address) => {
    console.log(
      '[MARKET:Update-Market]',
      `Processed ${processed[address]} ${marketplaceHelper.getTypeName(address)}`,
    );
  });
};
