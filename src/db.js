const { MongoClient } = require('mongodb');

const DB_URI = process.env.MONGODB_URI;
if (!DB_URI) {
  console.error('No env.MONGODB_URI set. Set one.');
  process.exit(0);
}

const { API_SECRET } = process.env;
if (!API_SECRET) {
  console.log('Starting with no secret, be careful.');
}

class Database {
  constructor() {
    this.isReady = new Promise((resolve, reject) => {
      console.log(`Connecting to Mongo @ ${DB_URI}`);
      const client = new MongoClient(process.env.MONGODB_URI, { useUnifiedTopology: true });
      client.connect().then(() => {
        const db = client.db('cryptoblades');

        this.$log = db.collection('log');

        this.$leaderboard = db.collection('leaderboard');
        this.$leaderboard.createIndex({ key: 1 });

        this.$fights = db.collection('leaderboard-fights');
        this.$fights.createIndex({ characterId: 1, wonFight: 1 });

        this.$wmints = db.collection('leaderboard-weaponmints');
        this.$cmints = db.collection('leaderboard-charactermints');
        this.$reforges = db.collection('leaderboard-reforges');
        this.$clevels = db.collection('leaderboard-characterlevels');
        this.$marketlists = db.collection('leaderboard-marketlists');
        this.$marketsells = db.collection('leaderboard-marketsells');
        this.$marketcancels = db.collection('leaderboard-marketcancels');
        this.$marketchanges = db.collection('leaderboard-marketchanges');

        this.$marketCharacters = db.collection('marketboard-characters');
        this.$marketCharacters.createIndex({ timestamp: 1 });
        this.$marketCharacters.createIndex({ charId: 1 });
        this.$marketCharacters.createIndex({ price: 1 });
        this.$marketCharacters.createIndex({ sellerAddress: 1 });
        this.$marketCharacters.createIndex({
          charLevel: 1, charElement: 1, price: 1, buyerAddress: 1,
        });
        this.$marketCharacters.createIndex({ charElement: 1, buyerAddress: 1, price: 1 });
        this.$marketCharacters.createIndex({ buyerAddress: 1, timestamp: 1 });
        this.$marketCharacters.createIndex({ buyerAddress: 1, price: 1 });
        this.$marketCharacters.createIndex({ charElement: 1, buyerAddress: 1, timestamp: 1 });

        this.$marketWeapons = db.collection('marketboard-weapons');
        this.$marketWeapons.createIndex({ timestamp: 1 });
        this.$marketWeapons.createIndex({ weaponId: 1 });
        this.$marketWeapons.createIndex({ price: 1 });
        this.$marketWeapons.createIndex({ sellerAddress: 1 });
        this.$marketWeapons.createIndex({
          weaponElement: 1, weaponStars: 1, price: 1, buyerAddress: 1,
        });
        this.$marketWeapons.createIndex({ buyerAddress: 1, weaponStars: 1 });
        this.$marketWeapons.createIndex({ buyerAddress: 1, timestamp: -1 });
        this.$marketWeapons.createIndex({ buyerAddress: 1, timestamp: 1 });
        this.$marketWeapons.createIndex({ buyerAddress: 1, price: 1 });
        this.$marketWeapons.createIndex({ weaponElement: 1, buyerAddress: 1, price: 1 });
        this.$marketWeapons.createIndex({ weaponElement: 1, buyerAddress: 1, timestamp: -1 });
        this.$marketWeapons.createIndex({ sellerAddress: 1, buyerAdress: 1, timestamp: -1 });

        this.$marketSales = db.collection('marketboard-sales');
        this.$marketSales.createIndex({ sellerAddress: 1 });

        this.$dataPoints = db.collection('datapoints');

        this.$notifications = db.collection('notifications');
        this.$notifications.createIndex({ timestamp: 1 });

        Object.keys(this).forEach((key) => {
          if (!key.includes('leaderboard-')) return;

          this[key].createIndex({ hash: 1 }, { unique: true });
        });

        resolve();
      });
    });
  }
}

exports.DB = new Database();
