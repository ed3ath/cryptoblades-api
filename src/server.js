
const fs = require('fs');
const express = require('express');

const { DB } = require('./db');
const { secretCheck } = require('./middleware/secret');

const unless = (path, middleware) => {
  return (req, res, next) => {
      if (req.path.includes(path)) {
          return next();
      } else {
          return middleware(req, res, next);
      }
  };
};

DB.isReady.then(() => {
  const app = express();
  app.use(require('cors')());

  app.use(unless('/character', secretCheck));

  const port = process.env.PORT || 3000;
  app.listen(port, () => {

    console.log('API started on port ' + port);

    fs.readdir(`${__dirname}/routes`, (err, files) => {
      files.forEach(file => {
        require(`${__dirname}/routes/${file}`).route(app);
      });
    });
  });
});