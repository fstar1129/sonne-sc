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
    let commands = "";
    [owner, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
    let instance, command;
    try {

        const usdc = await DeployAndGenerateVerifyCommand("Usdc");
        commands += usdc.command;
        const Velo = await DeployAndGenerateVerifyCommand("Velo");
        commands += Velo.command;
        await Velo.instance.initialMint(owner.address);
        const PairFactory = await DeployAndGenerateVerifyCommand("PairFactory");
        commands += PairFactory.command;
        const gauge = await DeployAndGenerateVerifyCommand("GaugeFactory");
        commands += gauge.command;
        const BribeFactory = await DeployAndGenerateVerifyCommand("BribeFactory");
        commands += BribeFactory.command;
        const VeArtProxy = await DeployAndGenerateVerifyCommand("VeArtProxy");
        commands += VeArtProxy.command;
        const VotingEscrow = await DeployAndGenerateVerifyCommand("VotingEscrow", Velo.instance.address, VeArtProxy.instance.address);
        commands += VotingEscrow.command;
        const factory = await DeployAndGenerateVerifyCommand("PairFactory");
        commands += factory.command;
        const bribes = await DeployAndGenerateVerifyCommand("BribeFactory");
        commands += bribes.command;
        const Voter = await DeployAndGenerateVerifyCommand("Voter", VotingEscrow.instance.address, factory.instance.address, gauge.instance.address, bribes.instance.address);
        commands += Voter.command;
        const RewardsDistributor = await DeployAndGenerateVerifyCommand("RewardsDistributor", VotingEscrow.instance.address);
        commands += RewardsDistributor.command;
        const minter = await DeployAndGenerateVerifyCommand("Minter", Voter.instance.address, VotingEscrow.instance.address, RewardsDistributor.instance.address);
        commands += minter.command;
        await Velo.instance.setMinter(minter.instance.address);
        const WETH9 = await DeployAndGenerateVerifyCommand("WETH9");
        commands += WETH9.command;
        const Router = await DeployAndGenerateVerifyCommand("Router", factory.instance.address, WETH9.instance.address);
        commands += Router.command;
        let vestingAmount = ethers.utils.parseEther("25000000");
        const oneDay = 86400;
        
        const periodDuration_ = oneDay/(24*2);
        const periodStart = await getCurrentTimeStamp();
        const periodEnd = periodStart + periodDuration_;
        this.vestingBegins = periodEnd + 1;
        this.vestingEnds = this.vestingBegins + oneDay ;
        
        const sonne = await DeployAndGenerateVerifyCommand("Sonne", owner.address);
        commands += sonne.command;
        
        await Voter.instance.whitelist(usdc.instance.address)
        await Voter.instance.whitelist(sonne.instance.address);
        const vestigSale = await DeployAndGenerateVerifyCommand("VesterSale", sonne.instance.address, owner.address, vestingAmount, this.vestingBegins, this.vestingEnds);
        commands += vestigSale.command;
        const OwnedDistributor = await DeployAndGenerateVerifyCommand("OwnedDistributor", sonne.instance.address, vestigSale.instance.address, owner.address);
        commands += OwnedDistributor.command;
        const LiquidityGenerator = await DeployAndGenerateVerifyCommand("LiquidityGenerator", [owner.address, sonne.instance.address, usdc.instance.address, Velo.instance.address, Router.instance.address, Voter.instance.address, owner.address, OwnedDistributor.instance.address
            , periodStart, periodDuration_]);
        commands += LiquidityGenerator.command;
          
        await OwnedDistributor.instance.setAdmin(LiquidityGenerator.instance.address);
        await vestigSale.instance.setRecipient(OwnedDistributor.instance.address);
        // const Voter = await ethers.getContractFactory("Voter");
        // this.Voter = await VoterFactory.deploy(this.VotingEscrow.address, this.factory.address, this.gauge.address, this.bribes.address);
    } catch (error) {
        console.log(error);
    }



    saveContentInFile("command.txt", commands);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
