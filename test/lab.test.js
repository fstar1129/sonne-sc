const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai'); 
const { BigNumber } = require('ethers');

const nullRoot = "0x" + ("0").repeat(64)

const getCurrentTimeStamp = async () => {
    return (await ethers.provider.getBlock('latest')).timestamp;
}
const increaseTime = async (timeInSecond) => {
    await ethers.provider.send("evm_increaseTime", [timeInSecond]);
}

describe("Lab", () => {

    let owner, bidder1, bidder2, bidder3, bidder4;
    let vestingAmount = ethers.utils.parseEther("25000000");
    
    
    // vestingBegin = periodEnd + 1
    // vestingEnd = vestingBegins + 365 days
    // const usdc = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
    // const velo = "0x08132180AFc971ddFDEcD2d6034794E7F20D486D";
    // const router0 = "0x9B237893321b2D447E1D1Ae02004ebA30b187D0d";
    // const voter = "0xb594c0337580bd06aff6ab50973a7ef228616cbd";
    // reserverManager = msg.sender;

    // VesterSale = VesterSale(sonne, msg.sender, vestingAmount, vestinfBegin, vestingEnd)
    // OwnedDistributor = OwnedDistributor(sonne, vesterSale, msg.sender)

    // LiquidityGenerator = LiquidityGenerator(msg.sender, sonne, usdc, velo,)
    // vesterSale.setReceipent(ownedDistributor);
    const oneDay = 86400;

    before(async () => {
        [owner, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
        const periodStart = await getCurrentTimeStamp();  
        const periodEnd = periodStart * oneDay*3;
        const vestingBegins = periodEnd + 1;
        const vestingEnds = vestingBegins + oneDay*365;
        const LabFactory = await ethers.getContractFactory("Sonne");
        const VesterSaleFactory = await ethers.getContractFactory("VesterSale"); 
        const OwnedDistributorFactory = await ethers.getContractFactory("OwnedDistributor"); 
        const LiquidityGeneratorFactory = await ethers.getContractFactory("LiquidityGenerator"); 
        const usdc = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
        const velo = "0x08132180AFc971ddFDEcD2d6034794E7F20D486D";
        const router0 = "0x9B237893321b2D447E1D1Ae02004ebA30b187D0d";
        const voter = "0xb594c0337580bd06aff6ab50973a7ef228616cbd";
        this.sonne = await LabFactory.deploy(owner.address);
        this.vestigSale = await VesterSaleFactory.deploy(this.sonne.address, owner.address, vestingAmount, vestingBegins, vestingEnds);
        this.OwnedDistributor = await OwnedDistributorFactory.deploy(this.sonne.address, this.vestigSale.address, owner.address);
        // this.LiquidityGenerator = await LiquidityGenerator.deploy(owner.address, this.sonne.address, usdc, velo, router0, voter, periodStart)
        console.log(this.lab.address);
    });
    it("Addresses", async ()=> {
        console.log(this.sonne.address)
    })
})