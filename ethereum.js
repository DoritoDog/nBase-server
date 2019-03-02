var exports = module.exports = {};

require('dotenv').load();

const Web3 = require('web3');
const tx = require('ethereumjs-tx');
var util = require('ethereumjs-util');
const lightWallet = require('eth-lightwallet');
const BigNumber = require('bignumber.js');

const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io/MalstqsO7EYyOSLpTUdi"));
const txUtils = lightWallet.txutils;

//#region Contract variables
const tokenAddress = '0xe056C79647dF965cbECe291998Dd8C238304726b';
const tokenBytecode = '60606040527f43727970746f436f696e000000000000000000000000000000000000000000006000906000191690557f43524300000000000000000000000000000000000000000000000000000000006001906000191690556012600260006101000a81548160ff021916908360ff160217905550341561007f57600080fd5b600260009054906101000a900460ff1660ff16600a0a60640260038190555033600460006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060035460056000600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610c38806101566000396000f3006060604052600436106100af576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde03146100b4578063095ea7b3146100e557806318160ddd1461013f57806323b872dd14610168578063313ce567146101e157806370a082311461021057806379c650681461025d5780638da5cb5b1461029f57806395d89b41146102f4578063a9059cbb14610325578063dd62ed3e1461037f575b600080fd5b34156100bf57600080fd5b6100c76103eb565b60405180826000191660001916815260200191505060405180910390f35b34156100f057600080fd5b610125600480803573ffffffffffffffffffffffffffffffffffffffff169060200190919080359060200190919050506103f1565b604051808215151515815260200191505060405180910390f35b341561014a57600080fd5b6101526104e3565b6040518082815260200191505060405180910390f35b341561017357600080fd5b6101c7600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff169060200190919080359060200190919050506104ed565b604051808215151515815260200191505060405180910390f35b34156101ec57600080fd5b6101f461061a565b604051808260ff1660ff16815260200191505060405180910390f35b341561021b57600080fd5b610247600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190505061062d565b6040518082815260200191505060405180910390f35b341561026857600080fd5b61029d600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050610676565b005b34156102aa57600080fd5b6102b261082c565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34156102ff57600080fd5b610307610852565b60405180826000191660001916815260200191505060405180910390f35b341561033057600080fd5b610365600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050610858565b604051808215151515815260200191505060405180910390f35b341561038a57600080fd5b6103d5600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff1690602001909190505061086f565b6040518082815260200191505060405180910390f35b60005481565b600081600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b6000600354905090565b6000600660008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054821115151561057a57600080fd5b81600660008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555061060f8484846108f6565b600190509392505050565b600260009054906101000a900460ff1681565b6000600560008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415156106d257600080fd5b80600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254019250508190555080600360008282540192505081905550600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1660007fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a38173ffffffffffffffffffffffffffffffffffffffff16600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35050565b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60015481565b60006108653384846108f6565b6001905092915050565b6000600660008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b6000808373ffffffffffffffffffffffffffffffffffffffff161415151561091d57600080fd5b81600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015151561096b57600080fd5b600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205482600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054011115156109f957600080fd5b600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205401905081600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a380600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054600560008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205401141515610c0657fe5b505050505600a165627a7a723058205bd6baa1063120591635c5b7cb1d903c15b2a5323076a89db2db58eef5ab69f30029';
const tokenABI = [
  {"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"tokens","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"tokens","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"accountAddress","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"target","type":"address"},{"name":"amount","type":"uint256"}],"name":"mintToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"tokens","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"account","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"tokens","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"tokenOwner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"tokens","type":"uint256"}],"name":"Approval","type":"event"}
];
//#endregion

const tokenDefinition = web3.eth.contract(tokenABI);
const token = tokenDefinition.at(tokenAddress);

function sendRawTx(rawTx, privateKeyString) {
    let privateKey = new Buffer(privateKeyString, 'hex');
    let transaction = new tx(rawTx);

    transaction.sign(privateKey);

    let serializedTx = transaction.serialize().toString('hex');

    web3.eth.sendRawTransaction('0x' + serializedTx, (error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log(result);
            return result;
        }
    });
}

function getAddress(privateKey) {
	privateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
	var buffer = util.privateToAddress(privateKey);
	return '0x' + buffer.toString('hex');
}

module.exports = {
    getBalance: address => {
        let balance = token.balanceOf(address);
        return web3.toDecimal(web3.fromWei(balance, 'ether'));
    },

		/**
		 * The amount is automatically converted into wei.
		 */
    transferTokens: (to, amount, privateKey) => {
        let from = getAddress(privateKey);
        amount = web3.toWei(amount);
        
        let options = {
            nonce: web3.toHex(web3.eth.getTransactionCount(from)),
            gasLimit: web3.toHex(800000),
            gasPrice: web3.toHex(20000000000),
            to: tokenAddress
        };
    
        let rawTx = txUtils.functionTx(tokenABI, 'transfer', [to, amount], options);
        return sendRawTx(rawTx, privateKey);
		},
		
		/**
		 * The amount is automatically converted into wei.
		 */
		mintToken: (target, amount) => {
			amount = web3.toWei(amount);
			let options = {
				nonce: web3.toHex(web3.eth.getTransactionCount(process.env.OWNER_ADDRESS)),
				gasLimit: web3.toHex(800000),
				gasPrice: web3.toHex(20000000000),
				to: tokenAddress
			};

			let rawTx = txUtils.functionTx(tokenABI, 'mintToken', [target, amount], options);
			return sendRawTx(rawTx, process.env.PRIVATE_KEY);
		},
};