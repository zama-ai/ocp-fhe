// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/Structs.sol";
import "../lib/Stock.sol";
import {LibDiamond} from "../../lib/diamond-3-hardhat/contracts/libraries/LibDiamond.sol";

contract StockFacet {
    // Storage structure for the diamond
    struct DiamondStorage {
        ActivePositions activePositions;
        SecIdsStockClass activeSecurityIdsByStockClass;
        bytes[] transactions;
        Issuer issuer;
        mapping(bytes16 => StockClass) stockClasses;
    }

    // Storage position in diamond storage
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.storage.stock");

    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    event StockIssued(
        bytes16 indexed stakeholderId, bytes16 indexed stockClassId, uint256 quantity, uint256 sharePrice
    );

    function issueStock(StockIssuanceParams memory params) internal {
        LibDiamond.enforceIsContractOwner();
        DiamondStorage storage ds = diamondStorage();

        // Create a new storage reference for the mappings
        // ActivePositions storage positionsMap = ActivePositions(ds.activePositions);
        // SecIdsStockClass storage activeSecsMap = SecIdsStockClass(ds.activeSecurityIdsByStockClass);

        // Pass the mappings directly
        StockLib.createIssuance(
            block.timestamp,
            params,
            ds.activePositions,
            ds.activeSecurityIdsByStockClass,
            ds.transactions,
            ds.issuer,
            ds.stockClasses[params.stock_class_id]
        );
    }
}
