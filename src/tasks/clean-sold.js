const PQueue = require('p-queue');
const pRetry = require('p-retry');

const marketplaceHelper = require('../helpers/marketplace-helper');
const multicall = require('../helpers/multicall');

const { DB } = require('../db');

const CONCURRENCY = parseInt(process.env.TASK_CONCURRENCY, 10) || 50;
const ITEMS_PER_PAGE = parseInt(process.env.MONGODB_ITEMS_PAGE, 10) || 10000;
const MAX_ITEMS_PER_REMOVE = parseInt(process.env.MAX_DELETE, 10) || 2000;
const MAX_PER_FINAL_PRICE_PULL = parseInt(process.env.MAX_PER_FINAL_PRICE_PULL, 10) || 500;

exports.duration = process.env.NODE_ENV === 'production' ? 86400 : 600;

exports.task = async () => {
  if (!await marketplaceHelper.init(':Clean-Up')) {
    return;
  }

  const tokenAddresses = [
    marketplaceHelper.getCharactersAddress(),
    marketplaceHelper.getWeaponsAddress(),
    marketplaceHelper.getShieldsAddress(),
  ];

  const reviewedIds = {};
  const soldIds = {};
  const processedIds = {};
  const removedIds = {};
  const toCheck = {};

  const queue = new PQueue({ concurrency: CONCURRENCY });

  const printTableStats = () => {
    const table = {};
    tokenAddresses.forEach((addr) => {
      table[marketplaceHelper.getTypeName(addr)] = {
        Reviewed: reviewedIds[addr],
        ToProcess: soldIds[addr].length,
        Processed: processedIds[addr].length,
        Removed: removedIds[addr],
      };
    });
    console.table(table);
  };

  const addTransactionBatch = async (nftAddress, itemIds) => {
    const collection = marketplaceHelper.getCollection(nftAddress);
    const idKey = marketplaceHelper.getIdKey(nftAddress);

    if (!collection || !idKey) return;

    const currentMarketEntrys = await DB[collection].find({ [idKey]: { $in: itemIds } }).toArray();
    if (currentMarketEntrys) {
      const type = marketplaceHelper.getTypeName(nftAddress);

      await pRetry(() => DB.$marketSales.insertMany(currentMarketEntrys.map((entry) => {
        const { _id, ...data } = entry;
        return {
          type,
          [type]: data,
        };
      })), { retries: 5 });
    }
  };

  const removeBatch = async (nftAddress, itemIds) => {
    const collection = marketplaceHelper.getCollection(nftAddress);
    const idKey = marketplaceHelper.getIdKey(nftAddress);

    if (!collection || !idKey) return;

    const removeResult = await pRetry(() => DB[collection].deleteMany({ [idKey]: { $in: itemIds } }), { retries: 5 });

    processedIds[nftAddress].push(...itemIds);
    removedIds[nftAddress] += removeResult.deletedCount;
  };

  const getBatch = async (nftAddress, page) => {
    if (page < 0) return null;

    const collection = marketplaceHelper.getCollection(nftAddress);
    const idKey = marketplaceHelper.getIdKey(nftAddress);

    if (!collection || !idKey) return null;

    const skip = ITEMS_PER_PAGE * (page);

    return pRetry(() => DB[collection].find({}, { [idKey]: 1, _id: 0 })
      .sort({ _id: 1 })
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .toArray(), { retries: 5 });
  };

  const checkToProcess = (maxLength) => {
    tokenAddresses.forEach((address) => {
      if (soldIds[address].length > maxLength) {
        const itemIds = [...soldIds[address]];
        soldIds[address] = [];
        queue.add(async () => {
          await addTransactionBatch(address, itemIds);
          await removeBatch(address, itemIds);
        });
      }
    });
  };

  const checkFinalPrice = (address, items) => {
    queue.add(async () => {
      const multicallData = marketplaceHelper.getFinalPriceCall(items);

      const prices = await pRetry(() => multicall(marketplaceHelper.getWeb3(), multicallData.abi, multicallData.calls), { retries: 5 });

      prices.forEach((price, i) => {
        reviewedIds[address] += 1;

        if (price <= 0) {
          soldIds[items[i].address].push(items[i].nftId);
        }
      });

      checkToProcess(MAX_ITEMS_PER_REMOVE);
    });
  };

  const runQueue = async (address, idKey, page) => {
    const results = await getBatch(address, page);
    if (!results) return;

    console.log(
      '[MARKET:Clean-Up]',
      `Page ${page} pulled ${results.length} ${marketplaceHelper.getTypeName(address)}`,
    );

    const resultsFound = results.length;

    while (results.length > 0) {
      const toProcess = results.splice(0, MAX_PER_FINAL_PRICE_PULL);

      checkFinalPrice(address, toProcess.map((item) => ({ address, nftId: item[idKey] })));
    }

    results.forEach((item) => {
      reviewedIds[address] += 1;
      queue.add(async () => {
        const price = +(await marketplaceHelper.getNftMarketPlace().methods.getFinalPrice(address, item[idKey]).call());

        if (price <= 0) {
          soldIds[address].push(item[idKey]);
        }
      });
    });

    checkToProcess(MAX_ITEMS_PER_REMOVE);

    if (resultsFound >= ITEMS_PER_PAGE) {
      queue.add(() => runQueue(address, idKey, page + 5));
    } else {
      checkToProcess(0);
    }

    if (page % 5 === 0) {
      printTableStats();
    }
  };

  tokenAddresses.forEach((address) => {
    reviewedIds[address] = 0;
    soldIds[address] = [];
    processedIds[address] = [];
    removedIds[address] = 0;
    toCheck[address] = [];

    const idKey = marketplaceHelper.getIdKey(address);

    for (let i = 0; i < 5; i += 1) {
      queue.add(() => runQueue(address, idKey, i));
    }
  });

  await queue.onIdle();

  checkToProcess(0);

  await queue.onIdle();

  console.log('[MARKET:Clean-Up]');
  printTableStats();
};
