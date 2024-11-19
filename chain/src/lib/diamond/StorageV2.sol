// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Issuer, StockClass, Stakeholder } from "../Structs.sol";

struct StorageV2 {
    bytes[] transactions;
    Issuer issuer;
    Stakeholder[] stakeholders;
    StockClass[] stockClasses;
    mapping(bytes16 => uint256) stakeholderIndex;
    mapping(bytes16 => uint256) stockClassIndex;
    // Reference to the ActivePositionNFT contract for managing positions
    address activePositionNFT;
}

library StorageLibV2 {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.storage_v2.stock");

    /// @notice Get the diamond storage
    /// @return ds The diamond storage
    function get() internal pure returns (StorageV2 storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
