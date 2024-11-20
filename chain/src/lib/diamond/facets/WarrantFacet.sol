// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StorageLib, Storage } from "../Storage.sol";
import { WarrantActivePosition } from "../Structs.sol";
import { TxHelper, TxType } from "../DiamondTxHelper.sol";

contract WarrantFacet {
    error NoStakeholder(bytes16 stakeholder_id);
    error InvalidStockClass(bytes16 stock_class_id);
    error InvalidQuantity();
    error InvalidExercisePrice();

    function issueWarrant(bytes16 stakeholder_id, uint256 quantity) external {
        Storage storage ds = StorageLib.get();
        ds.nonce++;

        _checkStakeholderIsStored(stakeholder_id);
        if (quantity == 0) revert InvalidQuantity();

        // Generate security ID
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stakeholder_id, ds.nonce);

        // Create and store position
        ds.warrantActivePositions.securities[securityId] = WarrantActivePosition({ quantity: quantity });

        // Track security IDs
        ds.warrantActivePositions.stakeholderToSecurities[stakeholder_id].push(securityId);

        // Store transaction
        bytes memory txData = abi.encode(stakeholder_id, quantity, securityId);
        TxHelper.createTx(TxType.WARRANT_ISSUANCE, txData);
    }

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

    function getWarrantPosition(bytes16 securityId) external view returns (WarrantActivePosition memory) {
        Storage storage ds = StorageLib.get();
        return ds.warrantActivePositions.securities[securityId];
    }
}
