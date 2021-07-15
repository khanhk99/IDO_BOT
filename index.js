// Lấy address của coin sắp IDO, address của coin sàn DEX
// Nhập số lượng thanh khoản chuẩn bị được add, 
// khi phát hiện lượng thanh khoản bằng số đã set sẽ mua 
// cho phép lượng thanh khoản chênh lênh một lượng nhất định
// Nhập số lượng coin sàn sẽ swap coin IDO


require('dotenv').config();
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const web3 = new Web3(new HDWalletProvider(process.env.PRIVATE_KEY, process.env.RPC_URL));
const { FACTORY_ABI, ROUTER_ABI, PAIR_ABI, TOKENCORE_ABI } = require('./contract_abi.js');

// Thay đổi số liệu
const FactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const RouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const TokenCore = "0xc778417e063141139fce010982780140aa0cd5ab";
const TokenList = "0x5531d5163a026ff36bbcf213144f6922bebb1832";
const LiquidityAdd = 1; // Lượng thanh khoản của TokenCore sẽ được add
const TokenCoreSwap = 0.1; // Số lượng TokenCore muốn swap
const Profit = '' ;   //uint: %, số lượng lợi nhuận muốn kiếm
const POLLING_INTERVAL = 3500;

const FactoryContract = new web3.eth.Contract(FACTORY_ABI, FactoryAddress);
const RouterContract = new web3.eth.Contract(ROUTER_ABI, RouterAddress);
// const CoreContract = new web3.eth.Contract(TOKENCORE_ABI, TokenCore);

const PairAddress = FactoryContract.methods.getPair(TokenCore, TokenList).call()

async function checkBlock() {
    var PairContract = new web3.eth.Contract(PAIR_ABI, await PairAddress);
    var token0 = await PairContract.methods.token0().call();
    var token1 = await PairContract.methods.token1().call();
    var getReserves = await PairContract.methods.getReserves().call();

    if(token0.toUpperCase() == TokenCore.toUpperCase()){
        var tokenCoreReserve = Number(web3.utils.fromWei(getReserves._reserve0, 'ether'));
        var tokenListReserve = Number(web3.utils.fromWei(getReserves._reserve1, 'ether'));
    }
    if(token1.toUpperCase() == TokenCore.toUpperCase()){
        var tokenCoreReserve = Number(web3.utils.fromWei(getReserves._reserve1, 'ether'));
        var tokenListReserve = Number(web3.utils.fromWei(getReserves._reserve0, 'ether'));
       
    }
    var priceTokenList = tokenCoreReserve/tokenListReserve;

    if(tokenCoreReserve >= LiquidityAdd){
        console.log(`tokenCoreReserve = ${tokenCoreReserve}`);
        clearInterval(checkLiquidity)
        buyToken(priceTokenList);
    }
}

async function buyToken(priceTokenList){
    var tokenCoreBalance = await checkTokenCoreBalance() 
    console.log(`tokenCoreBalance = ${tokenCoreBalance}`)
    if(tokenCoreBalance > TokenCoreSwap){
        var amountOut = TokenCoreSwap/priceTokenList;
        var amountOutMin = Number(web3.utils.toWei(String(amountOut*0.5/100), 'ether'));
        var path = [
            TokenCore,
            TokenList
        ];
        var deadline = Date.now() + 1000 * 60 * 5;

        RouterContract.methods.swapExactETHForTokens(
            amountOutMin, 
            path,
            process.env.ACCOUNT,
            deadline
        )
        .send()
        .then(console.log);
    }
}

async function checkTokenCoreBalance(){
    var balance = await web3.eth.getBalance(process.env.ACCOUNT);
    return Number(web3.utils.fromWei(String(balance), 'ether'));
}

var checkLiquidity = setInterval(async () => {
    checkBlock();
}, POLLING_INTERVAL);