// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GreenToken is ERC20, Ownable {
    // initialSupply is in smallest unit (wei for ERC20)
    constructor(uint256 initialSupply) ERC20("GreenToken", "GREEN") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    // Owner can mint more tokens
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

