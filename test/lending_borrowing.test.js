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

describe("Lending Borrowing", () => {
    let owner, bidder1, bidder2, bidder3, bidder4;
    const blocksPerYear_ = 31536000;
    const baseRatePerYear = 0;
    const multiplierPerYear = "49999999975142400";
    const jumpMultiplierPerYear = "1364999999973552000";
    const kink_ = "800000000000000000";
    const name_ = "JumpRateModelV4";
    // https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb-chain#BNB%20Chain%20Testnet
    const USDCOracle = "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0";
    const initialExchangeRateMantissa_ = ethers.utils.parseEther("1");
    const collateralFactorMantissa_ = "800000000000000000";
    before(async () => {
        [owner, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
        this.users = [owner, bidder1, bidder2, bidder3, bidder4];
        const UnitrollerFactory = await ethers.getContractFactory("Unitroller");
        this.Unitroller = await UnitrollerFactory.deploy();
        const ComptrollerFactory = await ethers.getContractFactory("Comptroller");
        this.Comptroller = await ComptrollerFactory.deploy();
        const ChainlinkPriceOracleFactory = await ethers.getContractFactory("ChainlinkPriceOracle");
        this.ChainlinkPriceOracle = await ChainlinkPriceOracleFactory.deploy(["soUSDC"], [USDCOracle], ["1000000"]);
        await this.Unitroller._setPendingImplementation(this.Comptroller.address);
        await this.Comptroller._become(this.Unitroller.address)
        this.Unitroller = (await ComptrollerFactory.attach(this.Unitroller.address))
        this.Unitroller._setPriceOracle(this.ChainlinkPriceOracle.address)
        // await this.Unitroller._setPriceOracle(this.ChainlinkPriceOracle.address);
        const JumpRateModelV4Factory = await ethers.getContractFactory("JumpRateModelV4");
        this.JumpRateModelV4 = await JumpRateModelV4Factory.deploy(blocksPerYear_, baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink_, owner.address, name_);
        const UsdcFactory = await ethers.getContractFactory("Usdc");
        this.Usdc = await UsdcFactory.deploy();
        const CErc20ImmutableFactory = await ethers.getContractFactory("CErc20Immutable");
        this.CErc20Immutable = await CErc20ImmutableFactory.deploy(this.Usdc.address, this.Unitroller.address, this.JumpRateModelV4.address, initialExchangeRateMantissa_, "Sonne USDC", "soUSDC", 6, owner.address);
        await this.CErc20Immutable._setReserveFactor("100000000000000000")
        await this.Unitroller._supportMarket(this.CErc20Immutable.address);
        await this.Unitroller._setCollateralFactor(this.CErc20Immutable.address, collateralFactorMantissa_);
    })
    // it("Mint", async () => {
    //     await this.Usdc.approve(this.CErc20Immutable.address, "500000")
    //     await this.CErc20Immutable.mint("500000");
    //     const bal = await this.CErc20Immutable.balanceOf(owner.address)
    //     expect(bal.toString()).is.equal("500000");
    // })
    // it("CollateralFactor", async () => {
    //     const { collateralFactorMantissa } = await this.Unitroller.markets(this.CErc20Immutable.address);
    //     expect(collateralFactorMantissa.toString()).is.equal(collateralFactorMantissa_);
    //     console.log(`Collateral: ${ethers.utils.formatEther(collateralFactorMantissa)}`);
    // })
    // it("borrow", async () => {
    //     const balBefore = await this.Usdc.balanceOf(owner.address)
    //     await this.CErc20Immutable.borrow("200000");
    //     const bal = await this.Usdc.balanceOf(owner.address)
    //     const borrowedBalance = await this.CErc20Immutable.borrowBalanceStored(owner.address);

    //     expect(borrowedBalance.toString()).is.equal("200000");
    //     expect(bal.sub(balBefore).toString()).is.equal("200000");
    // })
    // it("Redeem", async () => {
    //     const balBefore = await this.Unitroller.borrowCaps(owner.address)
    //     const borrowCap = balBefore.toString();

    //     // await this.CErc20Immutable.redeem(balBefore); 
    //     // const balAfter = await this.CErc20Immutable.balanceOf(owner.address)
    //     // console.log(balBefore.toString(), balAfter.toString());
    // })

});