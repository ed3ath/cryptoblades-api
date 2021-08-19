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
    if (await marketplaceHelper.isUserBanned(seller)) return;

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
      const type = marketplaceHelper.getTypeName(nftAddress);
      const { _id, ...data } = currentMarketEntry;
      await DB.$marketSales.insert({ type, [type]: data });
    }
  };

  const onNewListing = async (seller, nftAddress, nftId, price) => {
    createOrUpdate(nftAddress, nftId.toString(), price, seller).then(() => {
      console.log('[MARKET]', `Add ${marketplaceHelper.getTypeName(nftAddress)} ${nftId} from ${seller} for ${marketplaceHelper.realPrice(price)}`);
    }).catch((err) => console.log(`[MARKET ADD ERROR] ${err.message}`));
  };

  const onListingPriceChange = async (seller, nftAddress, nftId, price) => {
    createOrUpdate(nftAddress, nftId.toString(), price, seller).then(() => {
      console.log('[MARKET]', `Change ${marketplaceHelper.getTypeName(nftAddress)} ${nftId} from ${seller} for ${marketplaceHelper.realPrice(price)}`);
    }).catch((err) => console.log(`[MARKET CHANGE ERROR] ${err.message}`));
  };

  const onCancelledListing = async (seller, nftAddress, nftId) => {
    remove(nftAddress, nftId.toString()).then(() => {
      console.log('[MARKET]', `Cancel ${marketplaceHelper.getTypeName(nftAddress)} ${nftId} from ${seller}`);
    }).catch((err) => console.log(`[MARKET CANCEL ERROR] ${err.message}`));
  };

  const onPurchasedListing = async (buyer, seller, nftAddress, nftId) => {
    addTransaction(nftAddress, nftId.toString()).then(() => {
      remove(nftAddress, nftId.toString()).then(() => {
        console.log('[MARKET]', `Sell ${marketplaceHelper.getTypeName(nftAddress)} ${nftId} from ${seller} to ${buyer}`);
      }).catch((err) => console.log(`[MARKET PURCHASE1 ERROR] ${err.message}`));
    }).catch((err) => console.log(`[MARKET PURCHASE2 ERROR] ${err.message}`));
  };

  const setup = () => {
    const nftMarketPlace = marketplaceHelper.getNftMarketPlace();

    const events = {
      NewListing: {
        func: onNewListing,
        argsArr: (res) => ([res.seller, res.nftAddress, res.nftID, res.price]),
      },

      ListingPriceChange: {
        func: onListingPriceChange,
        argsArr: (res) => ([res.seller, res.nftAddress, res.nftID, res.newPrice]),
      },

      CancelledListing: {
        func: onCancelledListing,
        argsArr: (res) => ([res.seller, res.nftAddress, res.nftID]),
      },

      PurchasedListing: {
        func: onPurchasedListing,
        argsArr: (res) => ([res.buyer, res.seller, res.nftAddress, res.nftID]),
      },
    };

    nftMarketPlace.events.allEvents({ filter: {} })
      .on('data', (event) => {
        if (!events[event.event]) return;

        events[event.event].func(...events[event.event].argsArr(event.returnValues));
      }).on('error', (err) => {
        console.error('[MARKET]', err);
      });
  };

  setup();

  marketplaceHelper.providerEmitter.on('reconnected:nftMarketPlace', setup);
};

module.exports = {
  listen,
};
