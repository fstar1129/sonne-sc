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
    let LGEAmount = ethers.utils.parseEther("17500000");
    

    // vestingBegin = periodEnd + 1
    // vestingEnd = this.vestingBegins + 365 days
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

    const periodDuration_ = oneDay*3;
    before(async () => {
        [owner, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
        this.users = [owner, bidder1, bidder2, bidder3, bidder4];
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
        
        const WETH9Factory = await ethers.getContractFactory("WETH9");
        this.WETH9 = await WETH9Factory.deploy();
        const RouterFactory = await ethers.getContractFactory("Router");
        this.Router = await RouterFactory.deploy(this.factory.address, this.WETH9.address);

        let vestingAmount = ethers.utils.parseEther("25000000");
        const oneDay = 86400;
        const periodStart = await getCurrentTimeStamp();
        const periodEnd = periodStart + periodDuration_;
        this.vestingBegins = periodEnd + 1;
        this.vestingEnds = this.vestingBegins + oneDay*365;
        const LabFactory = await ethers.getContractFactory("Sonne");
        this.sonne = await LabFactory.deploy(owner.address);
        const VesterSaleFactory = await ethers.getContractFactory("VesterSale"); 
        const OwnedDistributorFactory = await ethers.getContractFactory("OwnedDistributor"); 
        const LiquidityGeneratorFactory = await ethers.getContractFactory("LiquidityGenerator"); 
        const usdc = this.Usdc.address;
        const velo = this.velo.address;
        const router0 = this.Router.address;
        const voter = this.Voter.address; 
        await this.Voter.whitelist(usdc)
        await this.Voter.whitelist(this.sonne.address); 
        this.vestigSale = await VesterSaleFactory.deploy(this.sonne.address, owner.address, vestingAmount, this.vestingBegins, this.vestingEnds);
        this.OwnedDistributor = await OwnedDistributorFactory.deploy(this.sonne.address, this.vestigSale.address, owner.address);
        this.LiquidityGenerator = await LiquidityGeneratorFactory.deploy([owner.address, this.sonne.address, usdc, velo, router0, voter, owner.address, this.OwnedDistributor.address
        , periodStart, periodDuration_]);
        await this.OwnedDistributor.setAdmin(this.LiquidityGenerator.address);
        await this.vestigSale.setRecipient(this.OwnedDistributor.address);

        for(let i = 1; i < this.users.length; i++) {
            const depositAmt = ethers.utils.parseUnits("500", "6")
            await this.Usdc.transfer(this.users[i].address, depositAmt);
        }
        await this.sonne.transfer(this.LiquidityGenerator.address, LGEAmount)
        await this.sonne.transfer(this.vestigSale.address, vestingAmount)
    });

    it("Deposit", async () => {
        const usersDeposit = new Map();
        for(let i = 0 ; i < this.users.length*2; i++){
            const index = i % this.users.length;
            const depositAmt = ethers.utils.parseUnits(parseInt((10 + (Math.random()*10)).toString()).toString(), "6")
            await this.Usdc.connect(this.users[index]).approve(this.LiquidityGenerator.address, depositAmt);
            await this.LiquidityGenerator.connect(this.users[index]).deposit(depositAmt);
        }
        await increaseTime(periodDuration_)
        await this.LiquidityGenerator.finalize()
        
        for(let i = 0; i < this.users.length; i++) {
            await this.OwnedDistributor.connect(this.users[i]).claim();
        }
        let sum = 0; 
        await increaseTime(this.vestingEnds-this.vestingBegins)

        for(let i = 0; i < this.users.length; i++) {
            const data = await this.LiquidityGenerator.distributorRecipients(this.users[i].address);
            const balance = await this.sonne.balanceOf(this.users[i].address);
            const amt = ethers.utils.formatEther(balance);
            console.log(amt);
            console.log(`\n************\nAmount: ${this.users[i].address}\nShare: ${data.shares}\nSonneBalance: ${amt}`);
            sum += parseFloat(amt);
        } 
    })
})