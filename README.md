# Command to deploy
```bash
npx hardhat run scripts/deploy.js --network mumbai
```
# Command to upgrade
```bash
npx hardhat run scripts/upgrade.js --network mumbai
```
# Command to test
```bash
npx hardhat test ./test/auctionV3.test.js
```
# Command to verify
```bash
npx hardhat verify 0x3c3066d18B610c01D3DA226c16279139ba761D83 --network mumbai --contract contracts/Auction.sol:Auctionv1
```

