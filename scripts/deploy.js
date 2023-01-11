// @dev. This script will deploy pFLASK contracts

const { BigNumber } = require('@ethersproject/bignumber')
const { ethers } = require('hardhat')
const hre = require("hardhat");



async function main() {

    const [deployer] = await ethers.getSigners() 
    console.log("deployer " + deployer.address)
    const Peso = await ethers.getContractFactory("Peso"); 
    const pesoInstance = await Peso.deploy();
    console.log("Peso contract: ", pesoInstance.address);
    // console.log(`RUM contract: ${this.rumContract.address}`);
    // console.log(`USDC contract: ${this.usdcContract.address}`);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
