
const fs = require('fs');
const express = require('express');

const { DB } = require('./db');
const { secretCheck } = require('./middleware/secret');

// cron related
const startTasks = () => {
  fs.readdir(`${__dirname}/tasks`, (err, files) => {
    files.forEach(file => {
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
const unless = (path, middleware) => {
  return (req, res, next) => {
      if (req.path.includes(path)) {
          return next();
      } else {
          return middleware(req, res, next);
      }
  };
};

const startApp = () => {
  const app = express();
  app.use(require('cors')());

  app.use(unless('/static', secretCheck));

  const port = process.env.PORT || 3000;
  app.listen(port, () => {

    console.log('API started on port ' + port);

    fs.readdir(`${__dirname}/routes`, (err, files) => {
      files.forEach(file => {
        require(`${__dirname}/routes/${file}`).route(app);
      });
    });
  });
};

// wait for DB to be ready then go
DB.isReady.then(() => {
  startApp();
  startTasks();
});
