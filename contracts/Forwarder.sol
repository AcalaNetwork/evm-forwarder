// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Forwarder {
    address dest;

    constructor(address dest_) {
        dest = dest_;
    }

    function forward(IERC20 token) public {
        token.transfer(dest, token.balanceOf(address(this)));
        selfdestruct(payable(dest));
    }
}

contract Factory {
    constructor() {}

    function deploy(address dest) public returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(dest));
        Forwarder forwarder = new Forwarder{salt: salt}(dest);
        return address(forwarder);
    }
}