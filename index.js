// Lấy address của coin sắp IDO, address của coin sàn DEX
// Nhập số lượng thanh khoản chuẩn bị được add, 
// khi phát hiện lượng thanh khoản bằng số đã set sẽ mua 
// cho phép lượng thanh khoản chênh lênh một lượng nhất định
// Nhập số lượng coin sàn sẽ swap coin IDO

const { Token, Fetcher, Trade, Route, TokenAmount, TradeType, Percent } = require('@uniswap/sdk');
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
const Profit = '';   //uint: %, số lượng lợi nhuận muốn kiếm
const POLLING_INTERVAL = 3500;

const FactoryContract = new web3.eth.Contract(FACTORY_ABI, FactoryAddress);
const RouterContract = new web3.eth.Contract(ROUTER_ABI, RouterAddress);
// const CoreContract = new web3.eth.Contract(TOKENCORE_ABI, TokenCore);

const PairAddress = FactoryContract.methods.getPair(TokenCore, TokenList).call();
const TokenListSdk = new Token(3, TokenList, 18);
const TokenCoreSdk = new Token(3, TokenCore, 18);

async function checkBlock() {
    var PairContract = new web3.eth.Contract(PAIR_ABI, await PairAddress);
    var token0 = await PairContract.methods.token0().call();
    var token1 = await PairContract.methods.token1().call();
    var getReserves = await PairContract.methods.getReserves().call();

    if (token0.toUpperCase() == TokenCore.toUpperCase()) {
        var tokenCoreReserve = Number(getReserves._reserve0);
        // var tokenListReserve = Number(getReserves._reserve1);
    }

    if (token1.toUpperCase() == TokenCore.toUpperCase()) {
        var tokenCoreReserve = Number(getReserves._reserve1);
        // var tokenListReserve = Number(getReserves._reserve0);
    }

    if (tokenCoreReserve >= Number(web3.utils.toWei(String(LiquidityAdd), 'ether'))) {
        clearInterval(checkLiquidity);
        buyToken();
    }
}

async function buyToken() {
    var tokenCoreBalance = await checkTokenCoreBalance()
    console.log(`tokenCoreBalance = ${tokenCoreBalance}, typeof: ${typeof tokenCoreBalance} \n`);

    if (tokenCoreBalance > TokenCoreSwap) {


        var pair = await Fetcher.fetchPairData(TokenListSdk, TokenCoreSdk);
        var route = new Route([pair], TokenCoreSdk);
        var amountIn = web3.utils.toWei(String(TokenCoreSwap), 'ether');
        console.log(`amountIn ${amountIn} \n`);
        var trade = new Trade(route, new TokenAmount(TokenCoreSdk, amountIn), TradeType.EXACT_INPUT);
        var slippageTolerance = new Percent('50', '10000');
        var amountOutMin = trade.minimumAmountOut(slippageTolerance).raw ;
        var path = [TokenCore, TokenList];
        var deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 20 minutes from the current Unix time
        console.log(`deadline ${deadline}`);
        // var value = trade.inputAmount.raw // // needs to be converted to e.g. hex
        console.log(`amountOutMin ${amountOutMin} type ${typeof amountOutMin} \n`);

        RouterContract.methods.swapExactETHForTokens(
            TokenCoreSwap,
            620141152087907029831774,
            path,
            process.env.ACCOUNT,
            deadline
        )
            .send({from: process.env.ACCOUNT})
            .then(console.log);
    }
}

async function checkTokenCoreBalance() {
    var balance = await web3.eth.getBalance(process.env.ACCOUNT);
    return Number(web3.utils.fromWei(String(balance), 'ether'));
}

var checkLiquidity = setInterval(async () => {
    checkBlock();
}, POLLING_INTERVAL);