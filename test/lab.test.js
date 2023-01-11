const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');
const { generateProof } = require("./merkleUtils");
const { BigNumber } = require('ethers');

const nullRoot = "0x" + ("0").repeat(64)

const getCurrentTimeStamp = async () => {
    return  (await ethers.provider.getBlock('latest')).timestamp;

}

describe("Auctions", () => {

    let owner, bidder1, bidder2, bidder3, bidder4;
    let LGEPortion = ethers.utils.parseEther("25_000_000"); 

    before(async () => {
        [owner, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
        const LabFactory = await ethers.getContractFactory("Lab");
        const VesterSale = await ethers.getContractFactory("VesterSale");
        this.lab = await LabFactory.deploy(owner);

        console.log(this.lab.address);
    });

})