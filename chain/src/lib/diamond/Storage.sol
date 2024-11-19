// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ActivePosition, Issuer, StockClass, Stakeholder, ConvertiblePosition } from "../Structs.sol";
struct Storage {
    mapping(bytes16 => mapping(bytes16 => ActivePosition)) activePositions;
    mapping(bytes16 => mapping(bytes16 => bytes16[])) activeSecurityIdsByStockClass;
    mapping(bytes16 => mapping(bytes16 => ConvertiblePosition)) activeConvertiblePositions;
    mapping(bytes16 => bytes16[]) activeConvertibleSecurityIds;
    Issuer issuer;
    Stakeholder[] stakeholders;
    StockClass[] stockClasses;
    mapping(bytes16 => uint256) stakeholderIndex;
    mapping(bytes16 => uint256) stockClassIndex;
    uint256 nonce;
}

library StorageLib {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.storage");

    /// @notice Get the diamond storage
    /// @return ds The diamond storage
    function get() internal pure returns (Storage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
