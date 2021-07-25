const fs = require('fs');
const express = require('express');

const { DB } = require('./db');
const { startRedis } = require('./helpers/redis-helper');
const { startLogging } = require('./logger');
const { secretCheck } = require('./middleware/secret');

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

const matches = (path, middleware) => (req, res, next) => {
  if (req.path.includes(path)) {
    return next();
  }

  return middleware(req, res, next);
};

const startApp = () => {
  const app = express();

  app.use(matches('/static', require('express-rate-limit')({
    windowMs: 1000 * 15,
    max: 5,
  })));

  app.use(require('body-parser').json());
  app.use(require('cors')());

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
  startRedis();
  startLogging();
});
