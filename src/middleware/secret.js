module.exports.secretCheck = (req, res, next) => {
  const secret = process.env.API_SECRET;

  if (secret && req.query.secret !== secret) {
    return res.status(403).send({ error: 'Invalid secret. See cryptoblades/cryptoblades-api documentation for how this works.' });
  }

  return next();
};
