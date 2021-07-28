const fs = require('fs');
const express = require('express');

const { DB } = require('./db');
const { startLogging } = require('./logger');
const { secretCheck } = require('./middleware/secret');
const { redis } = require('./helpers/redis-helper');

// cron related
const startTasks = () => {
  if (process.env.DYNO && process.env.DYNO !== 'web.1') return;

  fs.readdir(`${__dirname}/tasks`, (err, files) => {
    files.forEach((file) => {
      const { duration, task } = require(`${__dirname}/tasks/${file}`);

      console.log(`Running ${file}...`);
      task();

      setInterval(() => {
        console.log(`Running ${file}...`);
        task();
      }, duration * 1000);
    });
  });
};

// express related
const notmatches = (path, middleware) => (req, res, next) => {
  if (req.path.includes(path)) {
    return next();
  }

  return middleware(req, res, next);
};

const startApp = () => {
  const app = express();
  app.set('trust proxy', 1);

  const allowList = ['https://app.cryptoblades.io', 'https://cryptoblades.io'];
  const corsOptionsDelegate = (req, callback) => {
    // check if Origin header is present in the request
    if (process.env.NODE_ENV === 'production' && req.header('Origin') !== undefined) {
      // check if Origin header is among the allowed domains
      if (allowList.indexOf(req.header('Origin')) !== -1) {
        // reflect (enable) the requested origin in the CORS response
        corsOptions = { origin: req.header('Origin') }
      } else {
        // Origin is present in the request but not in allowList, we want browsers to block this
        // so respond with one of our allowed Origins
        corsOptions = { origin: allowList[0] }
      }
    } else {
      // disable CORS for this request
      corsOptions = { origin: false }
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
  }

  app.use(require('cors')(corsOptionsDelegate));

  const rateLimitOpts = {
    windowMs: 1000 * 10,
    max: 10,
    handler: secretCheck,
  };

  if (redis) {
    const RedisStore = require('rate-limit-redis');
    rateLimitOpts.store = new RedisStore({ client: redis });
  }

  app.use('/static/', require('express-rate-limit')(rateLimitOpts));

  app.use(require('body-parser').json());

  app.use(notmatches('/static', secretCheck));

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`API started on port ${port}`);

    fs.readdir(`${__dirname}/routes`, (err, files) => {
      files.forEach((file) => {
        require(`${__dirname}/routes/${file}`).route(app);
      });
    });
  });
};

// wait for DB to be ready then go
DB.isReady.then(() => {
  startApp();
  startTasks();
  startLogging();
});
