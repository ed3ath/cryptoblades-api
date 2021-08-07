const { BigNumber } = require('ethers');

const PQueue = require('p-queue');

const marketplaceHelper = require('../helpers/marketplace-helper');

const { DB } = require('../db');

const CONCURRENCY = process.env.TASK_CONCURRENCY || 50;
const ITEMS_PER_PAGE = process.env.MONGODB_ITEMS_PAGE || 10000;
const MAX_ITEMS_PER_REMOVE = process.env.MAX_DELETE || 2000;

exports.duration = process.env.NODE_ENV === 'production' ? 1800 : 600;

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

  const removeBatch = async (nftAddress, itemIds) => {
    const collection = marketplaceHelper.getCollection(nftAddress);
    const idKey = marketplaceHelper.getIdKey(nftAddress);

    if (!collection || !idKey) return;

    const removeResult = await DB[collection].deleteMany({ [idKey]: { $in: itemIds } });

    processedIds[nftAddress].push(...itemIds);
    removedIds[nftAddress] += removeResult.deletedCount;
  };

  const getBatch = async (nftAddress, page) => {
    const collection = marketplaceHelper.getCollection(nftAddress);
    const idKey = marketplaceHelper.getIdKey(nftAddress);

    if (!collection || !idKey) return null;

    const skip = ITEMS_PER_PAGE * (page);

    const findResult = await DB[collection].find({}, { [idKey]: 1, _id: 0 }).sort({ _id: 1 }).skip(skip).limit(ITEMS_PER_PAGE);

    return findResult.toArray();
  };

  const checkToProcess = () => {
    tokenAddresses.forEach((address) => {
      if (soldIds[address].length > 0) {
        const itemIds = [...soldIds[address]];
        soldIds[address] = [];
        queue.add(() => removeBatch(address, itemIds));
      }
    });
  };

  const nftMarketPlace = marketplaceHelper.getNftMarketPlace();

  const zero = BigNumber.from(0);

  const runQueue = async (address, idKey, page) => {
    const results = await getBatch(address, page);

    console.log(
      '[MARKET:Clean-Up]',
      `Page ${page} pulled ${results.length} ${marketplaceHelper.getTypeName(address)}`,
    );

    results.forEach((item) => {
      reviewedIds[address] += 1;
      queue.add(async () => {
        const price = await nftMarketPlace.getFinalPrice(address, item[idKey]);

        if (price.eq(zero)) {
          soldIds[address].push(item[idKey]);
        }
      });
    });

    checkToProcess();

    if (results.length === ITEMS_PER_PAGE) {
      queue.add(() => runQueue(address, idKey, page + 1));
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

    const idKey = marketplaceHelper.getIdKey(address);

    queue.add(() => runQueue(address, idKey, 0));
  });

  await queue.onIdle();

  checkToProcess();

  await queue.onIdle();

  console.log('[MARKET:Clean-Up]');
  printTableStats();
};
