// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(uint256 _initialBalance) ERC20("Token", "TKN") {
        _mint(msg.sender, _initialBalance);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}