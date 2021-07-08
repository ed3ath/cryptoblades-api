const { MongoClient } = require('mongodb');

const DB_URI = process.env.MONGODB_URI;
if(!DB_URI) {
  console.error('No env.MONGODB_URI set. Set one.');
  process.exit(0);
}

const API_SECRET = process.env.API_SECRET;
if(!API_SECRET) {
  console.log('Starting with no secret, be careful.');
}

class Database {
  constructor() {
    this.isReady = new Promise((resolve, reject) => {
      const client = new MongoClient(process.env.MONGODB_URI, { useUnifiedTopology: true });
      client.connect().then(() => {

        console.log('Connected to ' + DB_URI);
  
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

        Object.keys(this).forEach(key => {
          if(!key.startsWith('$')) return;
          if(key === '$log' || key === '$leaderboard') return;

          this[key].createIndex({ hash: 1 }, { unique: true });
        });

        resolve();
      });
    });
  }
}

exports.DB = new Database();
