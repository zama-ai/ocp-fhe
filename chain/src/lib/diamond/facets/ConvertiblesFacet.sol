// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StorageLib, Storage } from "../Storage.sol";
import { ConvertibleActivePosition } from "../Structs.sol";
import { TxHelper, TxType } from "../DiamondTxHelper.sol";
import { ValidationLib } from "../libraries/ValidationLib.sol";

contract ConvertiblesFacet {
    function issueConvertible(bytes16 stakeholder_id, uint256 investment_amount) external {
        Storage storage ds = StorageLib.get();
        ds.nonce++;

        ValidationLib.validateStakeholder(stakeholder_id);
        ValidationLib.validateAmount(investment_amount);

        // Generate security ID
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stakeholder_id, ds.nonce);

        // Create and store position
        ds.convertibleActivePositions.securities[securityId] = ConvertibleActivePosition({
            stakeholder_id: stakeholder_id,
            investment_amount: investment_amount
        });

        // Track security IDs for this stakeholder
        ds.convertibleActivePositions.stakeholderToSecurities[stakeholder_id].push(securityId);

        // Add reverse mapping
        ds.convertibleActivePositions.securityToStakeholder[securityId] = stakeholder_id;

        // Store transaction
        bytes memory txData = abi.encode(stakeholder_id, investment_amount, securityId);
        TxHelper.createTx(TxType.CONVERTIBLE_ISSUANCE, txData);
    }

    function getConvertiblePosition(bytes16 securityId) external view returns (ConvertibleActivePosition memory) {
        Storage storage ds = StorageLib.get();
        return ds.convertibleActivePositions.securities[securityId];
    }
}
