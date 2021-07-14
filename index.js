// Lấy address của coin sắp IDO, address của coin sàn DEX
// Nhập số lượng thanh khoản chuẩn bị được add, 
// khi phát hiện lượng thanh khoản bằng số đã set sẽ mua 
// cho phép lượng thanh khoản chênh lênh một lượng nhất định
// Nhập số lượng coin sàn sẽ swap coin IDO
// Nhập số lượng lãi, khi đạt đến số lượng này sẽ rút,
// hoặc thấy giá giảm một mức độ nhất định sẽ rút

const Web3 = require('web3');
const web3 = new Web3(process.env.RPC_URL);

// Thay đổi số liệu
const RouterAbi = '';
const RouterAddress = '';
const TokenCore = '';
const TokenList = '';
const LiquidityAdd; // Lượng thanh khoản của TokenCore sẽ được add
const TokenCoreSwap; // Số lượng TokenCore muốn swap
const Profit ;   //uint: %, số lượng lợi nhuận muốn kiếm
const FunctionAddLiquidity = '';
//

const RouterContract = new web3.eth.Contract(RouterAbi, RouterAddress);