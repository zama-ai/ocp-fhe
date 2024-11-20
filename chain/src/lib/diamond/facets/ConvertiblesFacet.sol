// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { console } from "forge-std/console.sol";
import { StorageLib, Storage } from "../Storage.sol";
import { ConvertibleActivePosition } from "../Structs.sol";
import { TxHelper, TxType } from "../DiamondTxHelper.sol";

contract ConvertiblesFacet {
    // Errors
    error NoStakeholder(bytes16 stakeholder_id);
    error InvalidAmount();

    function issueConvertible(bytes16 stakeholder_id, uint256 investment_amount) external {
        Storage storage ds = StorageLib.get();
        ds.nonce++;

        _checkStakeholderIsStored(stakeholder_id);
        if (investment_amount == 0) revert InvalidAmount();

        // Generate security ID
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stakeholder_id, ds.nonce);

        // Create and store position
        ds.convertibleActivePositions.securities[securityId] = ConvertibleActivePosition({
            investment_amount: investment_amount,
            timestamp: uint40(block.timestamp)
        });

        // Track security IDs
        ds.convertibleActivePositions.stakeholderToSecurities[stakeholder_id].push(securityId);

        // Store transaction
        bytes memory txData = abi.encode(stakeholder_id, investment_amount, securityId);
        TxHelper.createTx(TxType.CONVERTIBLE_ISSUANCE, txData);
    }

    function _checkStakeholderIsStored(bytes16 _id) internal view {
        Storage storage ds = StorageLib.get();
        if (ds.stakeholderIndex[_id] == 0) {
            revert NoStakeholder(_id);
        }
    }

    function getPosition(bytes16 securityId) external view returns (ConvertibleActivePosition memory) {
        Storage storage ds = StorageLib.get();
        return ds.convertibleActivePositions.securities[securityId];
    }
}
