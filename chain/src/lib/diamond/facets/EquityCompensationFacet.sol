// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { console } from "forge-std/console.sol";
import { StorageLib, Storage } from "../Storage.sol";
import { EquityCompensationActivePosition } from "../Structs.sol";
import { TxHelper, TxType } from "../DiamondTxHelper.sol";

contract EquityCompensationFacet {
    // Errors
    error NoStakeholder(bytes16 stakeholder_id);
    error InvalidStockClass(bytes16 stock_class_id);
    error InvalidStockPlan(bytes16 stock_plan_id);
    error InvalidQuantity();

    function issueEquityCompensation(bytes16 stakeholder_id, bytes16 stock_class_id, bytes16 stock_plan_id, uint256 quantity) external {
        Storage storage ds = StorageLib.get();
        ds.nonce++;

        // Validations
        _checkStakeholderIsStored(stakeholder_id);
        _checkInvalidStockClass(stock_class_id);
        _checkInvalidStockPlan(stock_plan_id);
        if (quantity == 0) revert InvalidQuantity();

        // Generate security ID
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stakeholder_id, ds.nonce);

        // Create and store position
        ds.equityCompensationActivePositions.securities[securityId] = EquityCompensationActivePosition({
            quantity: quantity,
            timestamp: uint40(block.timestamp),
            stock_class_id: stock_class_id,
            stock_plan_id: stock_plan_id
        });

        // Track security IDs for this stakeholder
        ds.equityCompensationActivePositions.stakeholderToSecurities[stakeholder_id].push(securityId);

        // Store transaction
        bytes memory txData = abi.encode(stakeholder_id, stock_class_id, stock_plan_id, quantity, securityId);
        TxHelper.createTx(TxType.EQUITY_COMPENSATION_ISSUANCE, txData);
    }

    // Helper functions
    function _checkStakeholderIsStored(bytes16 _id) internal view {
        Storage storage ds = StorageLib.get();
        if (ds.stakeholderIndex[_id] == 0) {
            revert NoStakeholder(_id);
        }
    }

    function _checkInvalidStockClass(bytes16 _stock_class_id) internal view {
        Storage storage ds = StorageLib.get();
        if (ds.stockClassIndex[_stock_class_id] == 0) {
            revert InvalidStockClass(_stock_class_id);
        }
    }

    function _checkInvalidStockPlan(bytes16 _stock_plan_id) internal view {
        Storage storage ds = StorageLib.get();
        if (ds.stockPlanIndex[_stock_plan_id] == 0) {
            revert InvalidStockPlan(_stock_plan_id);
        }
    }

    function getPosition(bytes16 securityId) external view returns (EquityCompensationActivePosition memory) {
        Storage storage ds = StorageLib.get();
        return ds.equityCompensationActivePositions.securities[securityId];
    }
}
