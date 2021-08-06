const fs = require('fs');
const express = require('express');

const { DB } = require('./db');
const { startLogging } = require('./logger');
const { secretCheck } = require('./middleware/secret');
const { authenticate } = require('./middleware/authenticate');
const { redis } = require('./helpers/redis-helper');

// cron related
const startTasks = () => {
  if (process.env.DYNO && process.env.DYNO !== 'web.1') return;

  fs.readdir(`${__dirname}/tasks`, (err, files) => {
    files.forEach((file) => {
      const { duration, task } = require(`${__dirname}/tasks/${file}`);

      if (duration === -1) return;

      console.log(`Running ${file}...`);
      task();

      setInterval(() => {
        console.log(`Running ${file}...`);
        task();
      }, duration * 1000);
    });
  });
};

// listeners
const startListeners = () => {
  if (process.env.DYNO && process.env.DYNO !== 'web.1') return;

  fs.readdir(`${__dirname}/listeners`, (err, files) => {
    files.forEach((file) => {
      const { listen } = require(`${__dirname}/listeners/${file}`);
      console.log(`Starting listener ${file}...`);
      listen();
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

  app.use(authenticate);
  app.use(notmatches('/static', secretCheck));

  const allowList = [
    'https://app.cryptoblades.io',
    'https://cryptoblades.io',
    'https://test.cryptoblades.io',
  ];
  const corsOptionsDelegate = (req, callback) => {
    let corsOptions = {};

    if (process.env.NODE_ENV === 'production' && req.header('Origin')) {
      if (allowList.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: req.header('Origin') };
      } else {
        corsOptions = { origin: allowList[0] };
      }
    } else {
      // disable CORS for this request
      corsOptions = { origin: false };
    }

    callback(null, corsOptions);
  };

  if (process.env.NODE_ENV === 'production') {
    app.use(require('cors')(corsOptionsDelegate));
  } else {
    app.use(require('cors')());
  }

  const rateLimitOpts = {
    windowMs: 1000 * 10,
    max: 10,
    handler: (req, res, next) => secretCheck(req, res, next, 429),
  };

  if (redis) {
    const RedisStore = require('rate-limit-redis');
    rateLimitOpts.store = new RedisStore({ client: redis });
  }

  app.use('/static/', require('express-rate-limit')(rateLimitOpts));

  app.use(require('body-parser').json());

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
DB.isReady.then(async () => {
  startApp();
  startTasks();
  startListeners();
  startLogging();
});
