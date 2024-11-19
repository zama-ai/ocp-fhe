// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { console } from "forge-std/console.sol";
import { StorageLib, Storage } from "../Storage.sol";
import { Issuer, StockClass, Stakeholder, ActivePosition, ShareNumbersIssued, SecurityLawExemption, StockIssuanceParams, StockIssuance } from "../../Structs.sol";
import { TxHelper, TxType } from "../DiamondTxHelper.sol";

contract StockFacet {
    // Errors
    error NoStakeholder(bytes16 stakeholder_id);
    error InvalidStockClass(bytes16 stock_class_id);

    function issueStock(StockIssuanceParams calldata params) external {
        Storage storage ds = StorageLib.get();
        ds.nonce++;

        _checkStakeholderIsStored(params.stakeholder_id);
        _checkInvalidStockClass(params.stock_class_id);

        uint256 stockClassIdx = ds.stockClassIndex[params.stock_class_id] - 1;
        StockClass storage stockClass = ds.stockClasses[stockClassIdx];
        require(ds.issuer.shares_issued + params.quantity <= ds.issuer.shares_authorized, "Issuer: Insufficient shares authorized");
        require(stockClass.shares_issued + params.quantity <= stockClass.shares_authorized, "StockClass: Insufficient shares authorized");

        // Generate security ID
        bytes16 id = TxHelper.generateDeterministicUniqueID(params.stakeholder_id, ds.nonce); // TODO: Ask Victor why we're passing stock_class_id here?
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(params.stock_class_id, ds.nonce);

        // Update storage
        ds.activePositions[params.stakeholder_id][securityId] = ActivePosition({
            stock_class_id: params.stock_class_id,
            quantity: params.quantity,
            share_price: params.share_price,
            timestamp: uint40(block.timestamp)
        });

        ds.activeSecurityIdsByStockClass[params.stakeholder_id][params.stock_class_id].push(securityId);

        // Update share counts
        ds.issuer.shares_issued += params.quantity;
        stockClass.shares_issued += params.quantity;

        // Create and store transaction
        StockIssuance memory issuance = StockIssuance({ id: id, object_type: "TX_STOCK_ISSUANCE", security_id: securityId, params: params });

        // Store transaction and emit event
        bytes memory txData = abi.encode(issuance);
        TxHelper.createTx(TxType.STOCK_ISSUANCE, txData);
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
}
