
const { DB } = require('../db')

exports.route = (app) => {
  app.get('/static/fights/:accountAddress', async (req, res) => {
    const { accountAddress } = req.params
    if (!accountAddress) {
      return res.status(400).json({ error: 'Invalid query. Must pass account address.' })
    }

    try {
      const fights = await DB.$fights.find({ accountAddress })
      res.json(fights.map(fight => {
        delete fight.hash
        return fight
      }))
    } catch (error) {
      return res.status(500).json({ error })
    }
  })
}
