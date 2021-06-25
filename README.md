# Wax API

## Setup

Create a `.env` file with the following:

- `MONGODB_URI` - a ref to the mongodb instance
- `API_SECRET` - a string that must be passed for transactions to work

## Run

- `npm start` to start the API

## Routes

All routes take `secret` as a URL parameter. This must match `API_SECRET` (if set) or the request will fail.

### Transactions

- `/add-transaction` - pass `waxWallet`, `bscWallet`, `waxAmount` as URL parameters