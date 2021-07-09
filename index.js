const { ethers } = require("ethers");
require('dotenv').config();
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const { FACTORY_ABI, ROUTER_ABI, PAIR_ABI } = require('./contract_abi.js');
var http = require('http');
var url = require('url');
var mysql = require('mysql');

//connect server
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "dex"
  });
  

const web3 = new Web3(new HDWalletProvider(process.env.PRIVATE_KEY, process.env.RPC_URL));
const provider = new ethers.providers.WebSocketProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
const account = wallet.connect(provider);
const TOKENCORE = process.env.TOKENCORE;
const POLLING_INTERVAL = 1000; // 1s
const ratioBuy = 0.05; //0,001 của BNB được add vào
const maxBuy = 0.5; // max buy of BNB: 0,5ETH
const factory = new ethers.Contract(
    process.env.FACTORY,
    ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
    account
);
const router = new web3.eth.Contract(ROUTER_ABI, process.env.ROUTER)

var countPairCreated = 0;
var bnbAdded50 = 0;
// Theo dõi cặp token mới được tạo
factory.on("PairCreated", async (token0, token1, pairAddress) => {
    countPairCreated++;
    console.log("---->So cap duoc tao: " + countPairCreated);
    console.log(`
      New pair detected
      =================
      token0: ${token0}
      token1: ${token1}
      pairAddress: ${pairAddress}
    `);
    var tokenIn;
    var tokenOut;
    if(token0.toUpperCase() == TOKENCORE.toUpperCase()){
        tokenIn = token0;
        tokenOut = token1;
    }
    else if(token1.toUpperCase() == TOKENCORE.toUpperCase()){
        tokenIn = token1;
        tokenOut = token0;
    }else{
        console.log("-----------NOT PAIR BNB-TOKEN--------");
        return;
    }
    console.log(`
        tokenIn: ${tokenIn}
        tokenOut: ${tokenOut}
    `);
    var pair = getContract(pairAddress);
    var ethAdded = await CheckLiquidityEthAdded(token0, token1, pairAddress);
    console.log(`BNB added: ${ethAdded}`);
    
    // check token eth thanh khoản >= 20 && <80 sẽ mua từng đợt
    // if((Number(ethAdded) >= 10) && (Number(ethAdded) < 50)){
    //     // Check lượng ETH được add đạt yêu cầu liên mua ratioBuy% ETH lần 1 (eg: 0,01%)
    //     // await buyToken()
    //     // Trong 5 phút đầu kể từ lúc mua token lần 1, mỗi phút cần có tối thiểu 1 giao dịch.
    //     result = await pair.methods.getReserves().call();
    //     console.log(web3.utils.fromWei(result._reserve0, 'ether'));
    //     console.log(web3.utils.fromWei(result._reserve1, 'ether'));
    // }

    // check token eth thanh khoản >= 50 mua ngay số lượng lớn
    if(Number(ethAdded) >= 50){
        let sql = 'INSERT INTO pair_created (token0, token1, pairAddress) VALUES (?, ?, ?)';
            con.query(sql, [tokenIn, tokenOut, pairAddress] ,async function (err, result, fields) {
              if (err) throw err;
              console.log(result);
            });
          
        bnbAdded50++;
        // Check giá hiện tại
        let amountIn = web3.utils.toWei(String(Number(ethAdded)*ratioBuy/100), 'ether');
        console.log(`amountIn: ${amountIn}`);
        let amounts = await router.methods.getAmountsOut(amountIn,[tokenIn, tokenOut]).call();
        console.log(`amounts: ${amounts}`);
        let amountOutMin = amounts[1] - (amounts[1]*0.1/100);
        console.log(`amountOutMin: ${amountOutMin}`);
        // Mua lần 1
        // let tx = await buyToken(amountOutMin, tokenIn, tokenOut);
        // Mua lần 1
        //Đợi giá x n hoặc giảm sâu kể từ lần đạt đỉnh
        // result = await pair.methods.getReserves().call();
        // console.log(web3.utils.fromWei(result._reserve0, 'ether'));
        // console.log(web3.utils.fromWei(result._reserve1, 'ether'));
    }

    console.log(`**bnbAdded50: ${bnbAdded50}**`);
});

// create object of pair created
function getContract(contractAddress){
    return new web3.eth.Contract(PAIR_ABI, contractAddress);
}

// Check ETH được add vào thanh khoản
async function CheckLiquidityEthAdded(token0, token1, contractAddress){
    var pair = getContract(contractAddress)
    var ethAdded;
    if(token0.toUpperCase() == TOKENCORE.toUpperCase()){
        // console.log("token0 is core");
        reserve = await pair.methods.getReserves().call();
        ethAdded = web3.utils.fromWei(reserve._reserve0, 'ether');
    }

    if(token1.toUpperCase() == TOKENCORE.toUpperCase()){
        // console.log("token1 is core");
        reserve = await pair.methods.getReserves().call();
        ethAdded = web3.utils.fromWei(reserve._reserve1, 'ether');
    }

    return ethAdded;
}

// Check độ biến động giá
function checkPriceMovement(){

}

// buy token swapExactETHForTokens
async function buyToken(amountOutMin, tokenIn, tokenOut){
    //path[0] == WETH
    let tx = await router.methods.swapExactETHForTokens(
        amountOutMin,
        [tokenIn, tokenOut],
        process.env.ACCOUNT,
        Date.now() + 1000 * 60 * 10 // 10 minutes
    ).send()
    // return tx;
}

// sell token swapExactTokensForETH
async function sellToken(){
    // router.methods.swapExactTokensForETH().send()
}

// async function checkBlock(addressToken) {
//     let block = await web3.eth.getBlock('latest');
//     if (block != null && block.transactions != null) {
//         for (let txHash of block.transactions) {
//             let tx = await web3.eth.getTransaction(txHash);
//             if (process.env.ROUTER == tx.to) {
//                 console.log('Found a transaction of ' + addressToken)
//                 console.log(tx)
//             }
//         }
//     }
// }

// setInterval(async () => {
//     checkBlock(token1);
// }, POLLING_INTERVAL);
