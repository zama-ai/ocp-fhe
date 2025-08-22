// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    StockActivePositions,
    ConvertibleActivePositions,
    EquityCompensationActivePositions,
    WarrantActivePositions,
    Issuer,
    StockClass,
    StockPlan,
    PrivateStockActivePositions
} from "src/libraries/Structs.sol";
import { euint64 } from "@fhevm/solidity/lib/FHE.sol";

struct Storage {
    // Access Control storage
    mapping(bytes32 => mapping(address => bool)) roles;
    mapping(bytes32 => bytes32) roleAdmin; // hierarchy of roles
    address currentAdmin; // Current admin address
    address pendingAdmin; // Pending admin address for ownership transfer
    // Existing storage
    Issuer issuer;
    bytes16[] stakeholders;
    mapping(bytes16 => uint256) stakeholderIndex;
    StockClass[] stockClasses;
    mapping(bytes16 => uint256) stockClassIndex;
    StockPlan[] stockPlans;
    mapping(bytes16 => uint256) stockPlanIndex;
    StockActivePositions stockActivePositions;
    ConvertibleActivePositions convertibleActivePositions;
    EquityCompensationActivePositions equityCompensationActivePositions;
    WarrantActivePositions warrantActivePositions;
    mapping(address => bytes16) addressToStakeholderId;
    // Private stock active positions
    PrivateStockActivePositions _privateStockActivePositions;
    // Campaign state
    uint256 totalPrivateSecuritiesIssued;
    // Round tracking
    mapping(bytes16 => euint64) round_total_amount;
    mapping(bytes16 => euint64) round_pre_money_valuation;
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
