// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { console } from "forge-std/console.sol";
import { StorageLib, Storage } from "../Storage.sol";
import { Issuer, StockClass, StockActivePosition } from "../Structs.sol";
import { TxHelper, TxType } from "../DiamondTxHelper.sol";

contract StockFacet {
    // Errors
    error NoStakeholder(bytes16 stakeholder_id);
    error InvalidStockClass(bytes16 stock_class_id);

    function issueStock(bytes16 stock_class_id, uint256 share_price, uint256 quantity, bytes16 stakeholder_id) external {
        Storage storage ds = StorageLib.get();
        ds.nonce++;

        _checkStakeholderIsStored(stakeholder_id);
        _checkInvalidStockClass(stock_class_id);

        uint256 stockClassIdx = ds.stockClassIndex[stock_class_id] - 1;
        StockClass storage stockClass = ds.stockClasses[stockClassIdx];
        require(ds.issuer.shares_issued + quantity <= ds.issuer.shares_authorized, "Issuer: Insufficient shares authorized");
        require(stockClass.shares_issued + quantity <= stockClass.shares_authorized, "StockClass: Insufficient shares authorized");

        // Generate security ID
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stakeholder_id, ds.nonce);

        // Update storage
        ds.stockActivePositions.securities[securityId] = StockActivePosition({
            stock_class_id: stock_class_id,
            quantity: quantity,
            share_price: share_price
        });

        // Track security IDs for this stakeholder
        ds.stockActivePositions.stakeholderToSecurities[stakeholder_id].push(securityId);

        // Update share counts
        ds.issuer.shares_issued += quantity;
        stockClass.shares_issued += quantity;

        // Store transaction
        bytes memory txData = abi.encode(stock_class_id, share_price, quantity, stakeholder_id, securityId);
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
