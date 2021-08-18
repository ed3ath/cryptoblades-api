module.exports.authenticateMarket = (req, res, next) => {
  const secret = process.env.API_SECRET;
  const otherSecret = process.env.API_SECRET_MARKET;

  const auth = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
  req.isAuthenticated = (secret && auth === secret) || (otherSecret && auth === otherSecret);
  return next();
};

module.exports.authenticateCalculated = (req, res, next) => {
  const secret = process.env.API_SECRET;
  const otherSecret = process.env.API_SECRET_CALCULATED;

  const auth = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
  req.isAuthenticated = (secret && auth === secret) || (otherSecret && auth === otherSecret);
  return next();
};
