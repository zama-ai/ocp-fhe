// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StorageLib, Storage } from "../Storage.sol";
import { WarrantActivePosition } from "../Structs.sol";
import { TxHelper, TxType } from "../DiamondTxHelper.sol";
import { ValidationLib } from "../libraries/ValidationLib.sol";

contract WarrantFacet {
    function issueWarrant(bytes16 stakeholder_id, uint256 quantity) external {
        Storage storage ds = StorageLib.get();
        ds.nonce++;

        ValidationLib.validateStakeholder(stakeholder_id);
        ValidationLib.validateQuantity(quantity);

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

    function getWarrantPosition(bytes16 securityId) external view returns (WarrantActivePosition memory) {
        Storage storage ds = StorageLib.get();
        return ds.warrantActivePositions.securities[securityId];
    }
}
