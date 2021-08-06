/* eslint-disable no-bitwise */
/* eslint-disable import/no-unresolved */

const ethers = require('ethers');

const DB = require('../db');
const updateABI = require('../tasks/update-abi');

// Provider
const provider = new ethers.providers.WebSocketProvider(
  process.env.WEBSOCKET_PROVIDER_URL, // Edit this with your provider url
);

const WeaponElement = {
  Fire: 0, Earth: 1, Lightning: 2, Water: 3,
};

function traitNumberToName(traitNum) {
  switch (traitNum) {
    case WeaponElement.Fire: return 'Fire';
    case WeaponElement.Earth: return 'Earth';
    case WeaponElement.Lightning: return 'Lightning';
    case WeaponElement.Water: return 'Water';
    default: return '';
  }
}

function getStatPatternFromProperties(properties) {
  return (properties >> 5) & 0x7f;
}

function getElementFromProperties(properties) {
  return (properties >> 3) & 0x3;
}

function getStarsFromProperties(properties) {
  return (properties) & 0x7;
}

function getStat1Trait(statPattern) {
  return (statPattern % 5);
}

function getStat2Trait(statPattern) {
  return (Math.floor(statPattern / 5) % 5);
}

function getStat3Trait(statPattern) {
  return (Math.floor(Math.floor(statPattern / 5) / 5) % 5);
}

const listen = async () => {
  await updateABI.task();

  let nftMarketPlace = null;
  let weapons = null;
  let characters = null;
  let shields = null;

  nftMarketPlace = new ethers.Contract(
    process.env.ADDRESS_MARKET || '0x90099dA42806b21128A094C713347C7885aF79e2',
    require('../data/abi/NFTMarket.json').abi,
    provider,
  );

  weapons = new ethers.Contract(
    process.env.ADDRESS_WEAPON || '0x7E091b0a220356B157131c831258A9C98aC8031A',
    require('../data/abi/Weapons.json').abi,
    provider,
  );

  characters = new ethers.Contract(
    process.env.ADDRESS_CHARACTER || '0xc6f252c2CdD4087e30608A35c022ce490B58179b',
    require('../data/abi/Characters.json').abi,
    provider,
  );

  shields = new ethers.Contract(
    process.env.ADDRESS_SHIELD || '0xf9E9F6019631bBE7db1B71Ec4262778eb6C3c520',
    require('../data/abi/Shields.json').abi,
    provider,
  );

  const realPrice = (price) => +ethers.utils.formatEther(price);

  const isCharacter = (nftAddress) => nftAddress === characters.address;
  const isWeapon = (nftAddress) => nftAddress === weapons.address;
  const isShield = (nftAddress) => nftAddress === shields.address;

  const getCollection = (nftAddress) => {
    if (isCharacter(nftAddress)) {
      return DB.$marketCharacters;
    }

    if (isWeapon(nftAddress)) {
      return DB.$marketWeapons;
    }

    if (isShield(nftAddress)) {
      return DB.$marketShields;
    }

    console.error('[MARKET]', `Unknown contract address (cannot get DB): ${nftAddress}`);

    return null;
  };

  const getNFTData = async (nftAddress, nftId, rawPrice, sellerAddress) => {
    const price = realPrice(rawPrice);
    const timestamp = Date.now();

    if (isCharacter(nftAddress)) {
      const character = await characters.get(nftId);
      const charLevel = parseInt(character[1], 10);
      const charElement = traitNumberToName(+character[2]);

      const ret = {
        charId: nftId.toNumber(), charLevel, charElement, price, timestamp, sellerAddress,
      };

      return ret;
    }

    if (isWeapon(nftAddress)) {
      const weapon = await weapons.get(nftId);
      const properties = weapon._properties;

      const weaponElement = getElementFromProperties(properties);
      const weaponStars = getStarsFromProperties(properties);

      const statPattern = getStatPatternFromProperties(properties);
      const stat1Element = traitNumberToName(getStat1Trait(statPattern));
      const stat2Element = traitNumberToName(getStat2Trait(statPattern));
      const stat3Element = traitNumberToName(getStat3Trait(statPattern));

      const stat1Value = weapon._stat1;
      const stat2Value = weapon._stat2;
      const stat3Value = weapon._stat3;

      const ret = {
        weaponId: nftId.toNumber(),
        weaponStars,
        weaponElement,
        stat1Element,
        stat2Element,
        stat3Element,
        stat1Value,
        stat2Value,
        stat3Value,
        price,
        timestamp,
        sellerAddress,
      };

      return ret;
    }

    if (isShield(nftAddress)) {
      const shield = await shields.get(nftId);
      const properties = shield._properties;

      const shieldElement = getElementFromProperties(properties);
      const shieldStars = getStarsFromProperties(properties);

      const statPattern = getStatPatternFromProperties(properties);
      const stat1Element = traitNumberToName(getStat1Trait(statPattern));
      const stat2Element = traitNumberToName(getStat2Trait(statPattern));
      const stat3Element = traitNumberToName(getStat3Trait(statPattern));

      const stat1Value = shield._stat1;
      const stat2Value = shield._stat2;
      const stat3Value = shield._stat3;

      return {
        shieldId: nftId.toNumber(),
        shieldStars,
        shieldElement,
        stat1Element,
        stat2Element,
        stat3Element,
        stat1Value,
        stat2Value,
        stat3Value,
        price,
        timestamp,
        sellerAddress,
      };
    }

    return {};
  };

  const getIdKey = (nftAddress) => {
    if (isCharacter(nftAddress)) {
      return 'charId';
    }

    if (isWeapon(nftAddress)) {
      return 'weaponId';
    }

    if (isShield(nftAddress)) {
      return 'shieldId';
    }

    return '';
  };

  const getTypeName = (nftAddress) => {
    if (isCharacter(nftAddress)) {
      return 'character';
    }

    if (isWeapon(nftAddress)) {
      return 'weapon';
    }

    if (isShield(nftAddress)) {
      return 'shield';
    }

    return '';
  };

  const createOrUpdate = (nftAddress, nftId, price, seller) => {
    const collection = getCollection(nftAddress);
    const data = getNFTData(nftAddress, nftId, price, seller);
    const idKey = getIdKey(nftAddress);

    if (!collection || !idKey) return;

    DB[collection].replaceOne({ [idKey]: nftId }, data, { upsert: true });
  };

  const remove = (nftAddress, nftId) => {
    const collection = getCollection(nftAddress);
    const idKey = getIdKey(nftAddress);

    if (!collection || !idKey) return;

    DB[collection].deleteOne({ [idKey]: nftId });
  };

  const addTransaction = async (nftAddress, nftId) => {
    const collection = getCollection(nftAddress);
    const idKey = getIdKey(nftAddress);

    if (!collection || !idKey) return;

    const currentMarketEntry = await DB[collection].findOne({ [idKey]: nftId });
    if (currentMarketEntry) {
      const { _id, ...weapon } = currentMarketEntry;
      await DB.$marketSales.insert({ type: getTypeName(nftAddress), weapon });
    }
  };

  const onNewListing = async (seller, nftAddress, nftId, price) => {
    createOrUpdate(nftAddress, nftId, price, seller);
    console.log('[MARKET]', `Add ${getTypeName(nftAddress)} ${nftId} from ${seller} for ${realPrice(price)}`);
  };

  const onListingPriceChange = async (seller, nftAddress, nftId, price) => {
    createOrUpdate(nftAddress, nftId, price, seller);
    console.log('[MARKET]', `Change ${getTypeName(nftAddress)} ${nftId} from ${seller} for ${realPrice(price)}`);
  };

  const onCancelledListing = async (seller, nftAddress, nftId) => {
    remove(nftAddress, nftId);
    console.log('[MARKET]', `Cancel ${getTypeName(nftAddress)} ${nftId} from ${seller}`);
  };

  const onPurchasedListing = async (buyer, seller, nftAddress, nftId) => {
    remove(nftAddress, nftId);
    addTransaction(nftAddress, nftId);
    console.log('[MARKET]', `Sell ${getTypeName(nftAddress)} ${nftId} from ${seller} to ${buyer}`);
  };

  nftMarketPlace.on('NewListing', onNewListing);
  nftMarketPlace.on('ListingPriceChange', onListingPriceChange);
  nftMarketPlace.on('CancelledListing', onCancelledListing);
  nftMarketPlace.on('PurchasedListing', onPurchasedListing);
};

module.exports = {
  listen,
};
