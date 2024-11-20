// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StorageLib, Storage } from "../Storage.sol";
import { EquityCompensationActivePosition } from "../Structs.sol";
import { TxHelper, TxType } from "../DiamondTxHelper.sol";
import { ValidationLib } from "../libraries/ValidationLib.sol";

contract EquityCompensationFacet {
    function issueEquityCompensation(bytes16 stakeholder_id, bytes16 stock_class_id, bytes16 stock_plan_id, uint256 quantity) external {
        Storage storage ds = StorageLib.get();
        ds.nonce++;

        ValidationLib.validateStakeholder(stakeholder_id);
        ValidationLib.validateStockClass(stock_class_id);
        ValidationLib.validateStockPlan(stock_plan_id);
        ValidationLib.validateQuantity(quantity);

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

    function getPosition(bytes16 securityId) external view returns (EquityCompensationActivePosition memory) {
        Storage storage ds = StorageLib.get();
        return ds.equityCompensationActivePositions.securities[securityId];
    }
}
