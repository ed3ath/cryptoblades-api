module.exports.secretCheck = (req, res, next) => {
  const secret = process.env.API_SECRET;

  const auth = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';

  if (secret && auth !== secret) {
    return res.status(403).send({ error: 'Invalid secret. See cryptoblades/cryptoblades-api documentation for how this works.' });
  }

  return next();
};
