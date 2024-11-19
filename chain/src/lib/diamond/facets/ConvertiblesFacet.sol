// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { console } from "forge-std/console.sol";
import { StorageLib, Storage } from "../Storage.sol";
import { ConvertiblePosition, ConvertibleParams, ConvertibleIssuance } from "../../Structs.sol";
import { TxHelper, TxType } from "../DiamondTxHelper.sol";

contract ConvertiblesFacet {
    // Errors
    error NoStakeholder(bytes16 stakeholder_id);
    error InvalidAmount();
    error InvalidConvertibleType();
    error InvalidValuationCap();
    error InvalidDiscountRate();

    function issueConvertible(ConvertibleParams calldata params) external {
        Storage storage ds = StorageLib.get();
        ds.nonce++;

        _checkStakeholderIsStored(params.stakeholder_id);
        _validateParams(params);

        // Generate IDs
        bytes16 id = TxHelper.generateDeterministicUniqueID(params.stakeholder_id, ds.nonce);
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(id, ds.nonce); // Note: Do we want id field to generate securityId?

        // Create and store position
        ds.activeConvertiblePositions[params.stakeholder_id][securityId] = ConvertiblePosition({
            investment_amount: params.investment_amount,
            valuation_cap: params.valuation_cap,
            discount_rate: params.discount_rate,
            convertible_type: params.convertible_type,
            timestamp: uint40(block.timestamp)
        });

        // Track security IDs
        ds.activeConvertibleSecurityIds[params.stakeholder_id].push(securityId);

        // Create issuance record
        ConvertibleIssuance memory issuance = ConvertibleIssuance({
            id: id,
            security_id: securityId,
            object_type: "TX_CONVERTIBLE_ISSUANCE",
            params: params
        });

        // Store transaction
        bytes memory txData = abi.encode(issuance);
        TxHelper.createTx(TxType.CONVERTIBLE_ISSUANCE, txData);
    }

    function _validateParams(ConvertibleParams memory params) internal pure {
        if (params.investment_amount == 0) {
            revert InvalidAmount();
        }
        if (params.valuation_cap == 0) {
            revert InvalidValuationCap();
        }
        if (params.discount_rate > 100) {
            revert InvalidDiscountRate();
        }

        bytes32 noteHash = keccak256(abi.encodePacked("NOTE"));
        bytes32 safeHash = keccak256(abi.encodePacked("SAFE"));
        bytes32 typeHash = keccak256(abi.encodePacked(params.convertible_type));

        if (typeHash != noteHash && typeHash != safeHash) {
            revert InvalidConvertibleType();
        }
    }

    // Helper functions
    function _checkStakeholderIsStored(bytes16 _id) internal view {
        Storage storage ds = StorageLib.get();
        if (ds.stakeholderIndex[_id] == 0) {
            revert NoStakeholder(_id);
        }
    }

    /*
    @dev Get a convertible position by stakeholder and security ID
    @param stakeholderId The ID of the stakeholder
    @param securityId The ID of the security
    @return The convertible position
    */
    function getPosition(bytes16 stakeholderId, bytes16 securityId) external view returns (ConvertiblePosition memory) {
        Storage storage ds = StorageLib.get();
        return ds.activeConvertiblePositions[stakeholderId][securityId];
    }
}
