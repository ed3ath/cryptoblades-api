const DB = require('../db');

exports.duration = process.env.NODE_ENV === 'production' ? 1800 : 600;

exports.task = async () => {
  // TODO clean sold items
};
