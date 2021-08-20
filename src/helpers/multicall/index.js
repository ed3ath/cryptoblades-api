const { Interface } = require('@ethersproject/abi');
const MultiCallAbi = require('./abis/multicall.json');

const addresses = {
  56: '0x1ee38d535d541c55c9dae27b12edf090c608e6fb',
};

async function multicall(web3, abi, calls) {
  const chainId = await web3.eth.getChainId();
  const multi = new web3.eth.Contract(MultiCallAbi, addresses[chainId]);
  const itf = new Interface(abi);

  const calldata = calls.map((call) => [
    call.address.toLowerCase(),
    itf.encodeFunctionData(call.name, call.params),
  ]);
  const { returnData } = await multi.methods.aggregate(calldata).call();
  const res = returnData.map((call, i) => itf.decodeFunctionResult(calls[i].name, call));

  return res;
}

module.exports = multicall;
