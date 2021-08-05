const ethers = require("ethers");
const { DB } = require("../db");
// Provider
const provider = new ethers.providers.WebSocketProvider(
  process.env.PROVIDER_WEBSOCKET_URL // Edit this with your provider url
);
//--
// Contracts
const nftMarketPlace = new ethers.Contract(
  process.env.MARKET_ADDRESS || "0x90099dA42806b21128A094C713347C7885aF79e2",
  require("../data/nft-market-abi.json"),
  provider
);
const weapons = new ethers.Contract(
  process.env.WEAPONS_ADDRESS || "0x7e091b0a220356b157131c831258a9c98ac8031a",
  require("../data/weapons-abi.json"),
  provider
);
const characters = new ethers.Contract(
  process.env.CHARACTERS_ADDRESS ||
    "0xc6f252c2CdD4087e30608A35c022ce490B58179b",
  require("../data/characters-abi.json"),
  provider
);
// End of Contracts

async function onNewListing(seller, nftAddress, nftID, price) {
  let sanitizedPrice = ethers.utils.formatEther(price);
  if (nftAddress.toLowerCase() === weapons.address.toLowerCase()) {
    // New Weapon Listed
    // let weaponStats = await weapons.
  } else if (nftAddress.toLowerCase() === characters.address.toLowerCase()) {
    // New character listed
  }
}
async function onListingPriceChange(seller, nftAddress, nftID, price) {}
async function onCancelledListing(seller, nftAddress, nftID, price) {}
async function onPurchasedListing(buyer, seller, nftAddress, nftID, price) {}

async function listen() {
  nftMarketPlace.on("NewListing", onNewListing);
  nftMarketPlace.on("ListingPriceChange", onListingPriceChange);
  nftMarketPlace.on("CancelledListing", onCancelledListing);
  nftMarketPlace.on("PurchasedListing", onPurchasedListing);
}

module.exports = {
  listen,
};
