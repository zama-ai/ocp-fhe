// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StorageV2 } from "./Structs.sol";

library StorageLibV2 {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.storage.stock");

    /// @notice Get the diamond storage
    /// @return ds The diamond storage
    function get() internal pure returns (StorageV2 storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
