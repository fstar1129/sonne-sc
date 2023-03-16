// @dev. This script will deploy pFLASK contracts

const { BigNumber } = require('@ethersproject/bignumber');
const fs = require('fs');
const { ethers } = require('hardhat')
const hre = require("hardhat");

async function main() {
    let owner, bidder1, bidder2, bidder3, bidder4;
    
    try {
        const CErc20Address = "0xD7D828f65E69536C9898A4fDa1FeE0741298f5c0";
        [owner, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
        const UsdcFactory = await ethers.getContractFactory("Usdc");
        this.Usdc = await UsdcFactory.deploy();
        const CErc20ImmutableFactory = await ethers.getContractFactory("CErc20Immutable");
        const CErc20Immutable = await CErc20ImmutableFactory.attach(CErc20Address);
        await this.Usdc.allowance(CErc20Immutable.address, "500000000");
        await CErc20Immutable.mint("500000000");
        // await Usdc.instance.transfer(bidder1.address, "500000");
        // await Usdc.instance.transfer(bidder2.address, "513252");
        // await Usdc.instance.transfer(bidder3.address, "500000");
      
    } catch (error) {
        console.log(error);
    }


 
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
