module.exports.secretCheck = (req, res, next, code = 403) => {
  const secret = process.env.API_SECRET;

  const auth = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';

  if (secret && auth !== secret) {
    const messages = {
      429: 'You are being rate limited. This can be bypassed if you pass a valid Authorization secret.',
      403: 'Invalid secret. See cryptoblades/cryptoblades-api documentation for how this works.',
    };

    return res.status(code).send({ error: messages[code] });
  }

  return next();
};
