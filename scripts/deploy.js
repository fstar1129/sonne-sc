// @dev. This script will deploy pFLASK contracts

const { BigNumber } = require('@ethersproject/bignumber')
const { ethers } = require('hardhat')
const hre = require("hardhat");

const getCurrentTimeStamp = async () => {
    return (await ethers.provider.getBlock('latest')).timestamp;
}
const increaseTime = async (timeInSecond) => {
    await ethers.provider.send("evm_increaseTime", [timeInSecond]);
}

async function main() {
    let owner, bidder1, bidder2, bidder3, bidder4;
    [owner, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
    const UsdcFactory = await ethers.getContractFactory("Usdc");
    this.Usdc = await UsdcFactory.deploy();
    console.log("USDC",this.Usdc.address);
    const VeloFactory = await ethers.getContractFactory("Velo");
    this.velo = await VeloFactory.deploy();
    console.log("Velo",this.velo.address);
    await this.velo.initialMint(owner.address);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
