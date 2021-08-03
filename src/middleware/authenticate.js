module.exports.authenticate = (req, res, next) => {
  const secret = process.env.API_SECRET;
  const auth = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
  req.isAuthenticated = secret && auth === secret;
  return next();
};
