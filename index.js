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
const FactoryAddress = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const RouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const TokenCore = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
const TokenList = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
const LiquidityAdd = 10000; // Lượng thanh khoản của TokenCore sẽ được add
const TokenCoreSwap = 1; // Số lượng TokenCore muốn swap
const Profit = '' ;   //uint: %, số lượng lợi nhuận muốn kiếm
const POLLING_INTERVAL = 1000;

const FactoryContract = new web3.eth.Contract(FACTORY_ABI, FactoryAddress);
const RouterContract = new web3.eth.Contract(ROUTER_ABI, RouterAddress);
const CoreContract = new web3.eth.Contract(TOKENCORE_ABI, TokenCore);

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
        clearInterval(checkLiquidity)
        buyToken(priceTokenList);
    }
}

async function buyToken(priceTokenList){
    if((await checkTokenCoreBalance()) > TokenCoreSwap){
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
    }
}

async function checkTokenCoreBalance(){
    var balance = await CoreContract.methods.balanceOf(process.env.ACCOUNT).call();
    return Number(balance);
}

var checkLiquidity = setInterval(async () => {
    checkBlock();
}, POLLING_INTERVAL);