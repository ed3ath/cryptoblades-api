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

- GET `/fight/add` - pass `timestamp`, `blockNumber`, `transactionHash`, `accountAddress`, `characterId`, `characterLevel`, `weaponId`, `weaponData`, `enemyId`, `wonFight`, `enemyRoll`, `playerRoll`, `xpGain`, `skillGain`
- GET `/wax/add` - pass `waxWallet`, `bscWallet` (optional), `waxAmount`, `waxChainTransactionId`, `waxChainBlockNumber`, `bscTransactionId` as URL parameters
