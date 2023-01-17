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
    let vestingAmount = ethers.utils.parseEther("25000000");
    const oneDay = 86400;
    const periodStart = await getCurrentTimeStamp();
    const periodDuration_ = oneDay*3;
    const periodEnd = periodStart + periodDuration_;
    const vestingBegins = periodEnd + 1;
    const vestingEnds = vestingBegins + oneDay*365;
    const LabFactory = await ethers.getContractFactory("Sonne");
    this.sonne = await LabFactory.deploy(owner.address);
    const VesterSaleFactory = await ethers.getContractFactory("VesterSale"); 
    const OwnedDistributorFactory = await ethers.getContractFactory("OwnedDistributor"); 
    const LiquidityGeneratorFactory = await ethers.getContractFactory("LiquidityGenerator"); 
    const usdc = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const velo = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const router0 = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
    const voter = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
    const VoterFactory = await ethers.getContractFactory("Voter");
    this.voter = await VoterFactory.attach(voter);
    await this.voter.whitelist(usdc)
    await this.voter.whitelist(this.sonne.address);
    console.log(await this.voter.gaugefactory());
    //BSCC mainnet addresses
    // const usdc = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
    // const velo = "0x08132180AFc971ddFDEcD2d6034794E7F20D486D";
    // const router0 = "0x9B237893321b2D447E1D1Ae02004ebA30b187D0d";
    // const voter = "0xb594c0337580bd06aff6ab50973a7ef228616cbd";
    this.vestigSale = await VesterSaleFactory.deploy(this.sonne.address, owner.address, vestingAmount, vestingBegins, vestingEnds);
    this.OwnedDistributor = await OwnedDistributorFactory.deploy(this.sonne.address, this.vestigSale.address, owner.address);
    this.LiquidityGenerator = await LiquidityGeneratorFactory.deploy([owner.address, this.sonne.address, usdc, velo, router0, voter, owner.address, this.OwnedDistributor.address
    , periodStart, periodDuration_])
    console.log(this.sonne.address);
    console.log("LiquidityGenerator: ",this.LiquidityGenerator.address);
    console.log("Distributor: ",this.OwnedDistributor.address);
    await this.OwnedDistributor.setAdmin(this.LiquidityGenerator.address);
    await this.vestigSale.setRecipient(this.OwnedDistributor.address);
    // console.log(`RUM contract: ${this.rumContract.address}`);
    // console.log(`USDC contract: ${this.usdcContract.address}`);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
