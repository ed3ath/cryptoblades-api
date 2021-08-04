# Wax API

## Setup

Create a `.env` file with the following:

- `MONGODB_URI` - a ref to the mongodb instance
- `API_SECRET` - a string that must be passed for transactions to work

## Run

- `npm start` to start the API

## Routes

All routes that are not `/static` take `secret` as a header - `Authorization: Bearer <secret>`. This must match `API_SECRET` (if set) or the request will fail.

### Getters

- GET `/static/leaderboard` - get the entire leaderboard
- GET `/static/characters/name/:id` - get character name by id
- GET `/static/weapons/name/:id` - get weapon name by id
- GET `/static/fights/:accountAddress` - get fight logs by account address
- GET `/notifications` - get all notifications in the last few days

### Transactions

Every endpoint additionally supports `gas` for logging and analytics purposes only.

#### Leaderboard
- POST `/leaderboard/fight/add` - pass `hash`, `accountAddress`, `characterId`, `characterLevel`, `weaponId`, `enemyId`, `wonFight`, `enemyRoll`, `playerRoll`, `xpGain`, `skillGain`
- POST `/leaderboard/weapon/mint/add` - pass `hash`, `accountAddress`, `weaponId`, `stars`
- POST `/leaderboard/weapon/reforge/add` - pass `hash`, `accountAddress`, `weaponId`, `burnId`
- POST `/leaderboard/character/mint/add` - pass `hash`, `accountAddress`, `charId`
- POST `/leaderboard/character/level/add` - pass `hash`, `accountAddress`, `charId`, `level`
- POST `/leaderboard/market/list/add` - pass `hash`, `accountAddress`, `nftAddress`, `nftId`, `price`
- POST `/leaderboard/market/change/add` - pass `hash`, `accountAddress`, `nftAddress`, `nftId`, `price`
- POST `/leaderboard/market/sell/add` - pass `hash`, `accountAddress`, `buyerAddress`, `nftAddress`, `nftId`, `price`
- POST `/leaderboard/market/cancel/add` - pass `hash`, `accountAddress`, `nftAddress`, `nftId`

#### WAX
- POST `/wax/add` - pass `waxWallet`, `bscWallet` (optional), `waxAmount`, `waxChainTransactionId`, `waxChainBlockNumber`, `bscTransactionId` as URL parameters

#### Marketplace
##### Characters
- GET `/static/market/character` - pass `element` (string), `minLevel` (num), `maxLevel` (num), `sortBy` (string; any character key), `sortDir` (-1 or 1), `pageSize` (default 60), `pageNum` (default 0), `sellerAddress`, `minPrice`, `maxPrice`
- PUT `/market/character/:charId` - pass `price`, (number), `charLevel` (num), `charElement` (string), `timestamp` (number), `sellerAddress` (string), `buyerAddress` (optional, string)
- GET `/market/character/:charId/sell` - mark this as sold (copy the entry from the market character collection)
- DELETE `/market/character/:charId` 
- DELETE `/market/character/all/:accountAddress`

##### Weapons
- GET `/static/market/weapon` - pass `element` (string), `minStars` (num), `maxStars` (num), `sortBy` (string; any weapon key), `sortDir` (-1 or 1), `pageSize` (default 60), `pageNum` (default 0), `sellerAddress`, `minPrice`, `maxPrice`
- PUT `/market/weapon/:weaponId` - pass `price`, (string), `weaponStars` (num), `weaponElement` (string), `stat1Element` (string), `stat1Value` (number), `stat2Element` (string), `stat2Value` (number), `stat3Element` (string), `stat3Value` (number), `timestamp` (number), `sellerAddress` (string), `buyerAddress` (optional, string)
- GET `/market/weapon/:weaponId/sell` - mark this as sold (copy the entry from the market weapon collection)
- DELETE `/market/weapon/:weaponId` 
- DELETE `/market/weapon/all/:accountAddress`
- GET `/static/market/transactions/:accountId`

##### Shields
- GET `/static/market/shield` - pass `element` (string), `minStars` (num), `maxStars` (num), `sortBy` (string; any weapon key), `sortDir` (-1 or 1), `pageSize` (default 60), `pageNum` (default 0), `sellerAddress`, `minPrice`, `maxPrice`
- PUT `/market/shield/:shieldId` - pass `price`, (string), `shieldStars` (num), `shieldElement` (string), `stat1Element` (string), `stat1Value` (number), `stat2Element` (string), `stat2Value` (number), `stat3Element` (string), `stat3Value` (number), `timestamp` (number), `sellerAddress` (string), `buyerAddress` (optional, string)
- GET `/market/shield/:shieldId/sell` - mark this as sold (copy the entry from the market shield collection)
- DELETE `/market/shield/:shieldId` 
- DELETE `/market/shield/all/:accountAddress`
- GET `/static/market/transactions/:accountId`
#### Calculated
- GET `/static/calculated/skill/price` - current SKILL price in USD
- POST `/calculated/skill/price` - pass `price` (number), `timestamp` (optional, number)
- GET `/static/calculated/skill/circulating` - current SKILL price in USD
- POST `/calculated/skill/circulating` - pass `total` (number), `timestamp` (optional, number)
- GET `/static/calculated/skill/contract` - current SKILL in dev contract
- POST `/calculated/skill/contract` - pass `total` (number), `timestamp` (optional, number)
- GET `/static/calculated/skill/holders` - current number of SKILL holders
- POST `/calculated/skill/holders` - pass `total` (number), `timestamp` (optional, number)
- GET `/static/calculated/skill/liquidity` - current liquidity value
- POST `/calculated/skill/liquidity` - pass `total` (number), `timestamp` (optional, number)
- GET `/static/calculated/skill/total` - current liquidity value
- POST `/calculated/skill/total` - pass `total` (number), `timestamp` (optional, number)