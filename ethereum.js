var exports = module.exports = {};

require('dotenv').load();

const Web3 = require('web3');
const tx = require('ethereumjs-tx');
var util = require('ethereumjs-util');
const lightWallet = require('eth-lightwallet');
const BigNumber = require('bignumber.js');

const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io/MalstqsO7EYyOSLpTUdi"));
const txUtils = lightWallet.txutils;

const fs = require('fs');

//#region Contract variables
const tokenAddress = process.env.CONTRACT_ADDRESS;
const tokenBytecode = fs.readFileSync('./bytecode.txt', 'utf8');
const tokenABI = JSON.parse(fs.readFileSync('./abi.txt', 'utf8'));
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