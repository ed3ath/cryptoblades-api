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
  
        const db = client.db('cryptoblades-wax');
        this.$log = db.collection('log');
        this.$transfers = db.collection('transfers');
        this.$fights = db.collection('fights');
        resolve();
      });
    });
  }
}

exports.DB = new Database();