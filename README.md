# Wax API

## Setup

Create a `.env` file with the following:

- `MONGODB_URI` - a ref to the mongodb instance
- `API_SECRET` - a string that must be passed for transactions to work

## Run

- `npm start` to start the API

## Routes

All routes that involve adding data take `secret` as a URL parameter. This must match `API_SECRET` (if set) or the request will fail.

### Getters

- GET `/characters/name/:id` - get character name by id

### Transactions

- GET `/leaderboard/fight/add` - pass `hash`, `accountAddress`, `characterId`, `characterLevel`, `weaponId`, `weaponData`, `enemyId`, `wonFight`, `enemyRoll`, `playerRoll`, `xpGain`, `skillGain`
- GET `/leaderboard/weapon/mint/add` - pass `hash`, `accountAddress`, `weaponId`
- GET `/leaderboard/weapon/reforge/add` - pass `hash`, `accountAddress`, `weaponId`, `burnId`
- GET `/leaderboard/character/mint/add` - pass `hash`, `accountAddress`, `charId`
- GET `/leaderboard/character/level/add` - pass `hash`, `accountAddress`, `charId`, `level`
- GET `/leaderboard/market/list/add` - pass `hash`, `accountAddress`, `nftAddress`, `nftId`, `price`
- GET `/leaderboard/market/change/add` - pass `hash`, `accountAddress`, `nftAddress`, `nftId`, `price`
- GET `/leaderboard/market/sell/add` - pass `hash`, `accountAddress`, `buyerAddress`, `nftAddress`, `nftId`, `price`
- GET `/leaderboard/market/cancel/add` - pass `hash`, `accountAddress`, `nftAddress`, `nftId`
- GET `/wax/add` - pass `waxWallet`, `bscWallet` (optional), `waxAmount`, `waxChainTransactionId`, `waxChainBlockNumber`, `bscTransactionId` as URL parameters
