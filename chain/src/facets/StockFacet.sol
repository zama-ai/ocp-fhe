// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "../../lib/diamond-3-hardhat/contracts/libraries/LibDiamond.sol";
import { StorageLib } from "../lib/Storage.sol";
import { Issuer, StockClass, Stakeholder, ActivePosition, ShareNumbersIssued, SecurityLawExemption, StockIssuanceParams, Storage } from "../lib/Structs.sol";

contract StockFacet {
    // Events
    event StockIssued(bytes16 indexed stakeholderId, bytes16 indexed stockClassId, uint256 quantity, uint256 sharePrice);

    // Errors
    error NoStakeholder(bytes16 stakeholder_id);
    error InvalidStockClass(bytes16 stock_class_id);

    function issueStock(StockIssuanceParams calldata params) external {
        Storage storage ds = StorageLib.get();

        _checkStakeholderIsStored(params.stakeholder_id);
        _checkInvalidStockClass(params.stock_class_id);

        uint256 stockClassIdx = ds.stockClassIndex[params.stock_class_id] - 1;
        StockClass storage stockClass = ds.stockClasses[stockClassIdx];

        require(ds.issuer.shares_issued + params.quantity <= ds.issuer.shares_authorized, "Issuer: Insufficient shares authorized");
        require(stockClass.shares_issued + params.quantity <= stockClass.shares_authorized, "StockClass: Insufficient shares authorized");

        // Generate security ID
        bytes16 securityId = bytes16(keccak256(abi.encodePacked(params.stakeholder_id, block.timestamp, block.prevrandao)));

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

        emit StockIssued(params.stakeholder_id, params.stock_class_id, params.quantity, params.share_price);
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
