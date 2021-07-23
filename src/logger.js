const Rollbar = require('rollbar');

let rollbar;

const init = () => {
  const token = process.env.ROLLBAR_ACCESS_TOKEN;
  if (!token) return;

  rollbar = new Rollbar({
    accessToken: token,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });
};

module.exports.startLogging = init;
module.exports.logger = rollbar;
