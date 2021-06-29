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

const POLLING_INTERVAL = 1000 // 1s

// console.log(factoryContract.events.PairCreated())
// console.log(factoryContract.methods.allPairsLength().call())

const methodIdCreatePair = "0xc9c65396";
const methodIdAddLiquidity = "0xe8e33700";
const methodIdAddLiquidityETH = "0xf305d719";
const methodIdswapExactETHForTokens = "0x7ff36ab5";

async function checkBlock() {
    let block = await web3.eth.getBlock('latest');
    let number = block.number;
    console.log('Searching block ' + number);

    if (block != null && block.transactions != null) {
        try{
            for (let txHash of block.transactions) {
                let tx = await web3.eth.getTransaction(txHash);
                if (process.env.ROUTER == tx.to) {
                    let binaryFunction = (tx.input).substring(0, 10);
                    if((binaryFunction == methodIdswapExactETHForTokens)){
                        console.log('Transaction found on block: ' + number);
                        let time = new Date();
                        console.log({
                            hash: tx.hash , 
                            from: tx.from, 
                            value: web3.utils.fromWei(tx.value, 'ether'), 
                            timestamp: time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + " " + time.getDate() + "/" + (time.getMonth()+1) + "/" + time.getFullYear(),
                            input: web3.eth.abi.decodeParameters(['uint256', 'address[]', 'address', 'uint256'],tx.input)
                        });
                    }
                }
            }
        }catch (error){
            console.error(error);
        }
    }
}

setInterval(() => {
    checkBlock();
},  POLLING_INTERVAL);