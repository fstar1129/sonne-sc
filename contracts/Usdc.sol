//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Usdc is ERC20 {
    constructor() ERC20("USDC", "USDC") {
        _mint(msg.sender, 500_000_000e6);
    }
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}