const marketplaceHelper = require('../helpers/marketplace-helper');

const banned = require('../../banned.json');

const { DB } = require('../db');

const listen = async () => {
  if (!process.env.WEBSOCKET_PROVIDER_URL) {
    console.log('No WEBSOCKET_PROVIDER_URL, not watching for market updates...');
    return;
  }

  if (!await marketplaceHelper.init()) {
    return;
  }

  const createOrUpdate = async (nftAddress, nftId, price, seller) => {
    if (banned.includes(seller)) return;

    const collection = marketplaceHelper.getCollection(nftAddress);
    const data = await marketplaceHelper.getNFTData(nftAddress, nftId, price, seller);
    const idKey = marketplaceHelper.getIdKey(nftAddress);

    if (!collection || !idKey) return;

    await DB[collection].replaceOne({ [idKey]: nftId }, data, { upsert: true });
  };

  const remove = async (nftAddress, nftId) => {
    const collection = marketplaceHelper.getCollection(nftAddress);
    const idKey = marketplaceHelper.getIdKey(nftAddress);

    if (!collection || !idKey) return;

    await DB[collection].deleteOne({ [idKey]: nftId });
  };

  const addTransaction = async (nftAddress, nftId) => {
    const collection = marketplaceHelper.getCollection(nftAddress);
    const idKey = marketplaceHelper.getIdKey(nftAddress);

    if (!collection || !idKey) return;

    const currentMarketEntry = await DB[collection].findOne({ [idKey]: nftId });
    if (currentMarketEntry) {
      const { _id, ...weapon } = currentMarketEntry;
      await DB.$marketSales.insert({ type: marketplaceHelper.getTypeName(nftAddress), weapon });
    }
  };

  const onNewListing = async (seller, nftAddress, nftId, price) => {
    await createOrUpdate(nftAddress, nftId.toString(), price, seller);
    console.log('[MARKET]', `Add ${marketplaceHelper.getTypeName(nftAddress)} ${nftId} from ${seller} for ${marketplaceHelper.realPrice(price)}`);
  };

  const onListingPriceChange = async (seller, nftAddress, nftId, price) => {
    await createOrUpdate(nftAddress, nftId.toString(), price, seller);
    console.log('[MARKET]', `Change ${marketplaceHelper.getTypeName(nftAddress)} ${nftId} from ${seller} for ${marketplaceHelper.realPrice(price)}`);
  };

  const onCancelledListing = async (seller, nftAddress, nftId) => {
    await remove(nftAddress, nftId.toString());
    console.log('[MARKET]', `Cancel ${marketplaceHelper.getTypeName(nftAddress)} ${nftId} from ${seller}`);
  };

  const onPurchasedListing = async (buyer, seller, nftAddress, nftId) => {
    await addTransaction(nftAddress, nftId.toString());
    await remove(nftAddress, nftId.toString());
    console.log('[MARKET]', `Sell ${marketplaceHelper.getTypeName(nftAddress)} ${nftId} from ${seller} to ${buyer}`);
  };

  const nftMarketPlace = marketplaceHelper.getNftMarketPlace();

  nftMarketPlace.on('NewListing', onNewListing);
  nftMarketPlace.on('ListingPriceChange', onListingPriceChange);
  nftMarketPlace.on('CancelledListing', onCancelledListing);
  nftMarketPlace.on('PurchasedListing', onPurchasedListing);
};

module.exports = {
  listen,
};
