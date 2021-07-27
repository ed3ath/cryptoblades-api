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

  const rateLimitOpts = {
    windowMs: 1000 * 10,
    max: 5,
  };

  if (redis) {
    const RedisStore = require('rate-limit-redis');
    rateLimitOpts.store = new RedisStore({ client: redis });
  }

  app.use('/static/', require('express-rate-limit')(rateLimitOpts));

  app.use(require('body-parser').json());
  app.use(require('cors')({
    origin: (origin, callback) => {
      if (origin.includes('cryptoblades.io')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  }));

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
