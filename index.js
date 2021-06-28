const { FACTORY_ABI, ROUTER_ABI } = require('./contract_abi.js')
require('dotenv').config();
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')

// //config
const web3 = new Web3(new HDWalletProvider(process.env.PRIVATE_KEY, process.env.RPC_URL))

// //factory
const factoryContract = new web3.eth.Contract(FACTORY_ABI, process.env.FACTORY)
// router
const routerContract = new web3.eth.Contract(ROUTER_ABI, process.env.ROUTER)

// const allPairs = factoryContract.methods.createPair("0xc778417e063141139fce010982780140aa0cd5ab", "0xad6d458402f60fd3bd25163575031acdce07538d").send((err, result) => {
//     console.log(err)
//     console.log(result)
// })

// routerContract.methods.WETH().call((err, result) => {
//     console.log(result)
// })

factoryContract.on('PairCreated', function(token0, token1, pairAddress){
    console.log(`
    New pair detected
    =================
    token0: ${token0}
    token1: ${token1}
    pairAddress: ${pairAddress}
  `);
})