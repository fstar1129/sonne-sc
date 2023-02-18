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
    const name_ = "JumpRateModelV4"
    const e18 = 1000000000000000000;
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
        await this.Usdc.transfer(bidder1.address, "500000");
        await this.Usdc.transfer(bidder2.address, "513252");
        await this.Usdc.transfer(bidder3.address, "500000");
    })

    const getSupplyRate = async () => {
        const supplyRate = await this.CErc20Immutable.supplyRatePerBlock();
        const blockPerYear = await this.JumpRateModelV4.blocksPerYear();
        const _rate = parseFloat((supplyRate.mul(blockPerYear)).toString());
        return _rate / e18;
    }

    const getBorrowRatePerBlock = async () => {
        const supplyRate = await this.CErc20Immutable.borrowRatePerBlock();
        const blockPerYear = await this.JumpRateModelV4.blocksPerYear();
        const _rate = parseFloat((supplyRate.mul(blockPerYear)).toString());
        return _rate / e18;
    }

    it("Mint", async () => {
        await this.Usdc.approve(this.CErc20Immutable.address, "500000")
        await this.CErc20Immutable.mint("500000");
        const bal = await this.CErc20Immutable.balanceOf(owner.address)
        expect(bal.toString()).is.equal("500000");
    })
    it("Supply Balance", async () => {
        const supplyBalance = (await this.CErc20Immutable.getAccountSnapshot(owner.address))[1];
        expect(supplyBalance.toString()).is.equal("500000");
    })
    it("CollateralFactor", async () => {
        const { collateralFactorMantissa } = await this.Unitroller.markets(this.CErc20Immutable.address);
        expect(collateralFactorMantissa.toString()).is.equal(collateralFactorMantissa_); 
    })
    //above 80% of collateral borrow is not allowed
    it("borrow Revert", async () => {
        await expect(this.CErc20Immutable.borrow("400001"))
            .to.be.revertedWithCustomError(this.CErc20Immutable, "BorrowComptrollerRejection");
    })
    it("borrow", async () => {
        const balBefore = await this.Usdc.balanceOf(owner.address)
        await this.CErc20Immutable.borrow("400000");
        const bal = await this.Usdc.balanceOf(owner.address)
        const borrowedBalance = await this.CErc20Immutable.borrowBalanceStored(owner.address);

        expect(borrowedBalance.toString()).is.equal("400000");
        expect(bal.sub(balBefore).toString()).is.equal("400000");
        
    })
    //getSupplyRate() function give annual return on Supplying the assets and this test increase time with 365 day and reedm the token
    it("Redeem", async () => {
        const amount = 500000;
        await this.Usdc.connect(bidder1).approve(this.CErc20Immutable.address, amount)
        await this.CErc20Immutable.connect(bidder1).mint(amount);
        const bal = await this.CErc20Immutable.balanceOf(bidder1.address)
        const balBefore = await this.CErc20Immutable.balanceOf(bidder1.address);
        await increaseTime(365 * 86400); 
        const rate = await getSupplyRate();
        await this.CErc20Immutable.connect(bidder1).redeem(balBefore);
         
        const balAfterUsdc = parseInt(await this.Usdc.balanceOf(bidder1.address))
        const amountReceivedAfterOneYear = amount*(1+ rate); 
        expect(amountReceivedAfterOneYear).to.be.closeTo(balAfterUsdc,0.1);
        // console.log(balBefore.toString(), balAfter.toString());
    })
 
    it("Repay Borrow", async () => {
        const borrowedAmount = 200000;
        await this.Usdc.connect(bidder2).approve(this.CErc20Immutable.address, "500000")
        await this.CErc20Immutable.connect(bidder2).mint("500000");
        
        await this.CErc20Immutable.connect(bidder2).borrow(borrowedAmount);
        await this.Usdc.connect(bidder2).approve(this.CErc20Immutable.address, "5000000000000000000")
        
        const borrowRate = await getBorrowRatePerBlock(); 
        await increaseTime(365 * 86400); 
        await this.CErc20Immutable.accrueInterest(); 
        const borrowedBalance = parseInt((await this.CErc20Immutable.borrowBalanceStored(bidder2.address)).toString());
        
        const repayAmount = borrowedAmount * (1 + borrowRate);   
        expect(repayAmount).to.be.closeTo(borrowedBalance,1);
        await this.CErc20Immutable.connect(bidder2).repayBorrow(borrowedBalance); 
        const borrow1 = await this.CErc20Immutable.borrowBalanceStored(bidder2.address);
        
        expect(borrow1.toString()).is.equal("0");
    })

    it("Liquidation", async () => {
        const borrowedAmount = 40001;
        await this.Usdc.connect(bidder3).approve(this.CErc20Immutable.address, "500000")
        await this.CErc20Immutable.connect(bidder3).mint("500000");
        await this.CErc20Immutable.connect(bidder3).borrow(borrowedAmount);
        let borrow = await this.CErc20Immutable.borrowBalanceStored(bidder3.address);
        await this.CErc20Immutable.connect(bidder3).liquidateBorrow(bidder3.address, borrow, this.CErc20Immutable.address);
        borrow = await this.CErc20Immutable.borrowBalanceStored(bidder3.address);
        
        console.log(borrow.toString());
    })
    
});