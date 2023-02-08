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
    const HUNDRED = BigNumber.from("1000");
    let LGE_PERCENTAGE = BigNumber.from("50");//5 %
    let PAIRED_WITH_PERCENTAGE = BigNumber.from("35");//3.5
    let IMMEDIATECLAIMABLE_PERCENTAGE = BigNumber.from("600");//60 %
    let VESTINGAMOUNT_PERCENTAGE = HUNDRED.sub(IMMEDIATECLAIMABLE_PERCENTAGE);//40 %
    let TOTAL_SUPPLY = ethers.utils.parseEther("500000000");
    let LGEAmount = TOTAL_SUPPLY.mul(LGE_PERCENTAGE).div(HUNDRED);
    let immediateClaimableAmount = LGEAmount.mul(IMMEDIATECLAIMABLE_PERCENTAGE).div(HUNDRED);
    let vestingAmount = LGEAmount.mul(VESTINGAMOUNT_PERCENTAGE).div(HUNDRED);
    let PAIRED_AMOUNT = TOTAL_SUPPLY.mul(PAIRED_WITH_PERCENTAGE).div(HUNDRED);

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

    const periodDuration_ = oneDay * 3;
    const vestingPeriod = oneDay * 30 * 3;// 3 Months
    before(async () => {
        [owner, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
        this.users = [owner, bidder1, bidder2, bidder3, bidder4];
        const UsdcFactory = await ethers.getContractFactory("Usdc");
        this.Usdc = await UsdcFactory.deploy();
        const VeloFactory = await ethers.getContractFactory("Velo");
        this.velo = await VeloFactory.deploy();
        await this.velo.initialMint(owner.address);


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

        const RewardsDistributorFactory = await ethers.getContractFactory("RewardsDistributor");
        this.RewardsDistributor = await RewardsDistributorFactory.deploy(this.VotingEscrow.address);
        const MinterFactory = await ethers.getContractFactory("Minter");
        this.minter = await MinterFactory.deploy(this.Voter.address, this.VotingEscrow.address, this.RewardsDistributor.address);
        this.velo.setMinter(this.minter.address);
        const WETH9Factory = await ethers.getContractFactory("WETH9");
        this.WETH9 = await WETH9Factory.deploy();
        const RouterFactory = await ethers.getContractFactory("Router");
        this.Router = await RouterFactory.deploy(this.factory.address, this.WETH9.address);

        const oneDay = 86400;
        const periodStart = await getCurrentTimeStamp();
        const periodEnd = periodStart + periodDuration_;
        this.vestingBegins = periodEnd + 1;
        this.vestingEnds = this.vestingBegins + vestingPeriod;
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
        this.vestigSale = await VesterSaleFactory.deploy(this.sonne.address, owner.address, immediateClaimableAmount, vestingAmount, this.vestingBegins, this.vestingEnds);
        this.OwnedDistributor = await OwnedDistributorFactory.deploy(this.sonne.address, this.vestigSale.address, owner.address);
        this.LiquidityGeneimmediateClaimableAmountrator = await LiquidityGeneratorFactory.deploy([owner.address, this.sonne.address, usdc, velo, router0, voter, owner.address, this.OwnedDistributor.address
            , periodStart, periodDuration_]);
        await this.OwnedDistributor.setAdmin(this.LiquidityGenerator.address);
        await this.vestigSale.setRecipient(this.OwnedDistributor.address);

        for (let i = 1; i < this.users.length; i++) {
            const depositAmt = ethers.utils.parseUnits("500", "6")
            await this.Usdc.transfer(this.users[i].address, depositAmt);
        }
        await this.sonne.transfer(this.LiquidityGenerator.address, PAIRED_AMOUNT)
        await this.sonne.transfer(this.vestigSale.address, LGEAmount)

        await this.VotingEscrow.setVoter(this.Voter.address);
        await this.Voter.initialize([this.velo.address], this.minter.address);

        const gaugeAddress = await this.LiquidityGenerator.gauge();
        const GauegeInstanceFactory = await ethers.getContractFactory("Gauge");
        this.gaugeInstance = await GauegeInstanceFactory.attach(gaugeAddress);
        await this.velo.approve(this.gaugeInstance.address, ethers.utils.parseEther("20"))
        await this.gaugeInstance.notifyRewardAmount(this.velo.address, ethers.utils.parseEther("20"));
    });



    it("Deposit and claim vested amount", async () => {
        const share = [];
        let depositAmts = [20, 30, 40, 10];
        let totalDeposit = 0;
        for (let i = 1; i < this.users.length; i++) {
            const depositAmt = ethers.utils.parseUnits(depositAmts[i - 1].toString(), "6")
            await this.Usdc.connect(this.users[i]).approve(this.LiquidityGenerator.address, depositAmt);
            await this.LiquidityGenerator.connect(this.users[i]).deposit(depositAmt);
            const depositAmtFloat = parseFloat(ethers.utils.formatUnits(depositAmt, "6"));
            share.push(depositAmtFloat);
            totalDeposit += depositAmtFloat;
        }
        await increaseTime(periodDuration_)
        await this.LiquidityGenerator.finalize();
        const pair = await this.LiquidityGenerator.pair0();
        const PairFactory = await ethers.getContractFactory("Pair");
        this.lpToken = await PairFactory.attach(pair);
        const usdcPairBalance = await this.Usdc.balanceOf(pair);
        const sonnePairBalance = await this.sonne.balanceOf(pair);

        expect(usdcPairBalance).is.equal(ethers.utils.parseUnits(parseInt(totalDeposit).toString(), "6"))
        expect(sonnePairBalance).is.equal(PAIRED_AMOUNT)

        let difference = this.vestingEnds - this.vestingBegins; 
        const immidiateClaimableFloat = parseFloat(ethers.utils.formatEther(immediateClaimableAmount));
        const vestingClaimable = [1000008.7999800591, 1500013.707661246, 2000018.9538032042, 500004.9076811868];
        for (let i = 1; i < this.users.length; i++) {
            const balBefore = ethers.utils.formatEther(await this.sonne.balanceOf(this.users[i].address));
            await this.OwnedDistributor.connect(this.users[i]).claim();
            const balAfter = ethers.utils.formatEther(await this.sonne.balanceOf(this.users[i].address));
            const totalClaimed = vestingClaimable[i-1] + immidiateClaimableFloat*(depositAmts[i-1]/100)
            
            expect(parseFloat(balAfter)).to.be.closeTo(totalClaimed,0.1);
        }
        while (difference > 0) {
            await increaseTime(oneDay * 10);
            for (let i = 1; i < this.users.length; i++) {
                await this.OwnedDistributor.connect(this.users[i]).claim();
                const bal = ethers.utils.formatEther(await this.sonne.balanceOf(this.users[i].address));
            }
            difference = Math.max(difference - oneDay * 10, 0);
        }
        const balance = await this.sonne.balanceOf(this.vestigSale.address);
        expect(balance.toString()).equal("0");
        const gaugeAddress = await this.LiquidityGenerator.gauge();
        const lpBalanceOfGauge = await this.lpToken.balanceOf(gaugeAddress);

        await expect(this.LiquidityGenerator.deliverLiquidityToReservesManager())
            .to.be.revertedWith("LiquidityGenerator: STILL_LOCKED");
        const reserverManager = await this.LiquidityGenerator.reservesManager();
        await increaseTime(180 * oneDay)
        await this.LiquidityGenerator.deliverLiquidityToReservesManager()
        const reservesManagerLpBalance = await this.lpToken.balanceOf(reserverManager);
        expect(lpBalanceOfGauge.toString()).is.equal(reservesManagerLpBalance.toString());

 
    })

    it("Veldrome Token interaction", async () => {
        const value = ethers.utils.parseEther("200");
        const fourWeek = oneDay * 7 * 4;
        await this.velo.approve(this.VotingEscrow.address, value);
        let tx = await this.VotingEscrow.create_lock(value, fourWeek);
        const { events } = await tx.wait()
        const args = events.map(event => event.args)
        const tokenId = args[0].tokenId;
        const pools = [this.lpToken.address];
        const weights = ["10000"];
        tx = await this.Voter.vote(tokenId, pools, weights);
        const lgBalanceBefore = await this.velo.balanceOf(owner.address);
        await increaseTime(fourWeek)
        tx = await this.LiquidityGenerator.claimVeloRewards()
        const lgBalanceAfter = await this.velo.balanceOf(owner.address);
        console.log(ethers.utils.formatEther(lgBalanceAfter.sub(lgBalanceBefore)));
    })
})