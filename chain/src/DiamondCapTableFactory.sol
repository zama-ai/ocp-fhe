// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondCapTable.sol";

contract DiamondCapTableFactory {
    event CapTableCreated(address indexed capTable, address indexed owner);

    function createCapTable() external returns (address) {
        DiamondCapTable newCapTable = new DiamondCapTable(msg.sender);
        emit CapTableCreated(address(newCapTable), msg.sender);
        return address(newCapTable);
    }
}
