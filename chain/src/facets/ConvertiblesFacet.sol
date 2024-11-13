// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/Structs.sol";

contract ConvertiblesFacet {
    event ConvertibleIssued(address indexed to, uint256 amount, uint256 price, uint256 timestamp);

    function issueConvertible(address to, uint256 amount, uint256 price) external {
        // Implementation for convertible issuance
        emit ConvertibleIssued(to, amount, price, block.timestamp);
    }
}
