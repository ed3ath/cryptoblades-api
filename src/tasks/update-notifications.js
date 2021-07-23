const Parser = require('rss-parser');

const { DB } = require('../db');

exports.duration = process.env.NODE_ENV === 'production' ? 3600 : 5;

exports.task = async () => {
  const parser = new Parser();
  try {
    const feed = await parser.parseURL('https://cryptoblades.medium.com/feed');

    const items = feed.items.map((x) => ({
      hash: require('path').basename(x.guid),
      title: x.title,
      link: x.link,
      timestamp: new Date(x.isoDate).getTime(),
    }));

    items.forEach(async (item) => {
      try {
        await DB.$notifications.replaceOne({ hash: item.hash }, item, { upsert: true });
      } catch (error) {
        console.error(`Could not log notification ${JSON.stringify(item)}: ${error}`);
      }
    });
  } catch {
    console.error('Could not fetch announcements.');
  }
};
