const ethers = require("ethers");
const ethUtil = require('ethereumjs-util');
const { keccak256 } = require('ethers').utils;

const privateKey = '0x81e15ddea9e47cdf17c7ba95b1e4fac9392cb2fc38a825d6674246dbe2ab1fc1';
const wallet = new ethers.Wallet(privateKey)
console.log(wallet.address);

function hash(data) {
    return ethers.utils.keccak256(data);
}

async function signMessage() {
    const domain = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" }, 
    ];
    const type = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
    const typeHash = keccak256(type);
    console.log(typeHash);
    const transferMessage = [
        { name: "nonce", type: "uint256"},
        { name: "to", type: "address"},
        { name: "amount", type: "uint256"}
    ];

    const domainData = {
        name: "Mint",
        version: "1",
        chainId: 1,
        verifyingContract: "0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8", 
    };
    var message = {
        nonce: 1,
        to: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        amount: 1000
    };
    const data = JSON.stringify({
        types: {
            EIP712Domain: domain,
            TransferMessage: transferMessage
        },
        domain: domainData,
        primaryType: "TransferMessage",
        message: message
    });
    wallet.provider
    const flatSig = await wallet.signMessage(data);
    let sig = ethers.utils.splitSignature(flatSig);

    console.log(sig);
}   

signMessage()
