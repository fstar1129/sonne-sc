//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Lab is ERC20 {
    constructor(address account) ERC20("Labyrinthea", "Lab") {
        _mint(account, 500_000_000e18);
    }
}