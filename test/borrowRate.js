const borrowRate = (base, multiplier, utilizationRate, knik, jumpMultiplier) => {
    return base + multiplier +  Math.min(utilizationRate,  knik) + Math.max(jumpMultiplier * utilizationRate - knik, 0);
}
const blocksPerYear = 31536000;
const base = 0;
const multiplier = 1981861998;
const utilizationRate = 771161548764420643;
const knik = 800000000000000000;
const jumpMultiplier = 43283866057 ;
const rate = borrowRate(base, multiplier, utilizationRate, knik, jumpMultiplier);
console.log(rate.toString(10));