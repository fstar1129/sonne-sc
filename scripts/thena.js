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
    const VeloFactory = await ethers.getContractFactory("Velo");
    this.velo = await VeloFactory.deploy();
    const PairFactory = await ethers.getContractFactory("PairFactory");
    this.factory = await PairFactory.deploy();
    const GaugeFactory = await ethers.getContractFactory("GaugeFactory");
    this.gauge = await GaugeFactory.deploy();
    const BribeFactory = await ethers.getContractFactory("BribeFactory");
    this.bribes = await BribeFactory.deploy();
    const VeArtProxyFactory = await ethers.getContractFactory("VeArtProxy");
    this.VeArtProxy = await VeArtProxyFactory.deploy();
    const VotingEscrowFactory = await ethers.getContractFactory("VotingEscrow");
    this.VotingEscrow = await VotingEscrowFactory.deploy(this.velo.address, this.VeArtProxy.address);
    const VoterFactory = await ethers.getContractFactory("Voter");
    this.Voter = await VoterFactory.deploy(this.VotingEscrow.address, this.factory.address, this.gauge.address, this.bribes.address);
    console.log(await this.Voter.gaugefactory(), this.gauge.address)
    const WETH9Factory = await ethers.getContractFactory("WETH9");
    this.WETH9 = await WETH9Factory.deploy();
    const RouterFactory = await ethers.getContractFactory("Router");
    this.Router = await RouterFactory.deploy(this.factory.address, this.WETH9.address);
    console.log("Velo Contract: ", this.velo.address);
    console.log("Factory Contract: ", this.factory.address);
    console.log("GaugeFactory Contract: ", this.gauge.address);
    console.log("BribeFactory Contract: ", this.bribes.address);
    console.log("VeArtProxy Contract: ", this.VeArtProxy.address);
    console.log("Router Contract: ", this.Router.address);
    console.log("Voter Contract: ", this.Voter.address);
    console.log("Usdc Contract: ", this.Usdc.address);
    
    // console.log(`RUM contract: ${this.rumContract.address}`);
    // console.log(`USDC contract: ${this.usdcContract.address}`);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
