// @dev. This script will deploy pFLASK contracts

const { BigNumber } = require('@ethersproject/bignumber');
const fs = require('fs');
const { ethers } = require('hardhat')
const hre = require("hardhat");

const getCurrentTimeStamp = async () => {
    return (await ethers.provider.getBlock('latest')).timestamp;
}
const increaseTime = async (timeInSecond) => {
    await ethers.provider.send("evm_increaseTime", [timeInSecond]);
}

const generateVerifyCommand = (network, address, argsFileName = null) => {
    if (argsFileName === null)
        return `npx hardhat verify ${address} --network ${network}`;
    else
        return `npx hardhat verify --constructor-args ${argsFileName} ${address} --network ${network}`;
}

const saveContentInFile = (fileName, content) => {
    fs.writeFileSync(fileName, content);
}
const saveArgsFile = async (fileName, args) => {

    const content = `module.exports = ${JSON.stringify(args)}`;
    saveContentInFile(fileName, content);
}

const DeployAndGenerateVerifyCommand = async (ContractName, ...args) => {
    const Factory = await ethers.getContractFactory(ContractName);
    let instance;
    let argsFileName = null;
    if (args.length === 0) {
        instance = await Factory.deploy();
    } else {
        instance = await Factory.deploy(...args);
        argsFileName = ContractName + ".js";
        saveArgsFile(argsFileName, args);
    }
    console.log(`${ContractName}: `, instance.address);
    return {
        instance,
        command: `\n${ContractName}\n${generateVerifyCommand(hre.network.name, instance.address, argsFileName)}`
    }
}


async function main() {
    let owner, bidder1, bidder2, bidder3, bidder4;
    const blocksPerYear_ = 31536000;
    const baseRatePerYear = 0;
    const multiplierPerYear = "49999999975142400";
    const jumpMultiplierPerYear = "1364999999973552000";
    const kink_ = "800000000000000000";
    const name_ = "JumpRateModelV4"
    const e18 = 1000000000000000000;
    // https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb-chain#BNB%20Chain%20Testnet
    const USDCOracle = "0x90c069C4538adAc136E051052E14c1cD799C41B7";
    const initialExchangeRateMantissa_ = ethers.utils.parseEther("1");
    const collateralFactorMantissa_ = "800000000000000000";
    let commands = "";
    try {
        [owner, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
        const Unitroller = await DeployAndGenerateVerifyCommand("Unitroller"); 
        commands += Unitroller.command;
        const Comptroller = await DeployAndGenerateVerifyCommand("Comptroller"); 
        commands += Comptroller.command; 
        const ChainlinkPriceOracle = await DeployAndGenerateVerifyCommand("ChainlinkPriceOracle", ["soUSDC"], [USDCOracle], ["1000000"]);
        commands += ChainlinkPriceOracle.command; 
        await Unitroller.instance._setPendingImplementation(Comptroller.instance.address);
        await Comptroller.instance._become(Unitroller.instance.address)
        const ComptrollerFactory = await ethers.getContractFactory("Comptroller");
        Unitroller.instance = (await ComptrollerFactory.attach(Unitroller.instance.address))
        await Unitroller.instance._setPriceOracle(ChainlinkPriceOracle.instance.address)
        const JumpRateModelV4 = await DeployAndGenerateVerifyCommand("JumpRateModelV4", blocksPerYear_, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink_, owner.address, name_);
        commands += JumpRateModelV4.command
        const Usdc= await DeployAndGenerateVerifyCommand("Usdc");
        commands += Usdc.command;

        const CErc20Immutable = await DeployAndGenerateVerifyCommand("CErc20Immutable", Usdc.instance.address, Unitroller.instance.address, JumpRateModelV4.instance.address, initialExchangeRateMantissa_, "Sonne USDC", "soUSDC", 6, owner.address);
        commands += CErc20Immutable.command;
        await CErc20Immutable.instance._setReserveFactor("100000000000000000")
        await Unitroller.instance._supportMarket(CErc20Immutable.instance.address);
        await Unitroller.instance._setCollateralFactor(CErc20Immutable.instance.address, collateralFactorMantissa_);
        // await Usdc.instance.transfer(bidder1.address, "500000");
        // await Usdc.instance.transfer(bidder2.address, "513252");
        // await Usdc.instance.transfer(bidder3.address, "500000");
      
    } catch (error) {
        console.log(error);
    }



    saveContentInFile("command_lending.txt", commands);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
