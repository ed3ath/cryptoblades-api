const fs = require('fs-extra');
const fetch = require('node-fetch');

const ABI_URL = 'https://app.cryptoblades.io/abi/';
const ABIS = ['Characters', 'NFTMarket', 'Weapons', 'Shields'];

exports.duration = process.env.NODE_ENV === 'production' ? -1 : -1;

exports.task = async () => {
  fs.ensureDirSync('./src/data/abi');

  await Promise.all(ABIS.map(async (name) => {
    const abi = await fetch(`${ABI_URL}/${name}.json`).then((res) => res.json());

    await fs.writeJson(`./src/data/abi/${name}.json`, abi);
  }));
};
