// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StorageLibV2 } from "../lib/StorageV2.sol";
import { StorageV2, StockClass } from "../lib/Structs.sol";
import { IActivePositionNFT } from "../interfaces/IActivePositionNFT.sol";
import { StockIssuanceParams } from "../lib/Structs.sol";

contract StockFacetV2 {
    event StockIssued(bytes16 indexed stakeholderId, bytes16 indexed stockClassId, uint256 quantity, uint256 sharePrice);

    // Errors
    error StockClassDoesNotExist(bytes16 stockClassId);
    error ActivePositionNFTNotSet();

    function issueStock(StockIssuanceParams calldata params) external {
        StorageV2 storage ds = StorageLibV2.get();

        // Check if stock class exists
        if (ds.stockClassIndex[params.stock_class_id] == 0) {
            revert StockClassDoesNotExist(params.stock_class_id);
        }

        // Ensure ActivePositionNFT contract is set
        address nftAddress = ds.activePositionNFT;
        if (nftAddress == address(0)) {
            revert ActivePositionNFTNotSet();
        }

        // Interact with ActivePositionNFT to mint/update position
        uint256 tokenId = IActivePositionNFT(nftAddress).getTokenByStakeholder(params.stakeholder_id);

        if (tokenId == 0) {
            // Mint a new NFT if stakeholder doesn't already have one
            tokenId = generateTokenId(params.stakeholder_id, params.stock_class_id);
            IActivePositionNFT(nftAddress).mintPosition(
                msg.sender, // Recipient of the NFT
                tokenId,
                params.stakeholder_id,
                params.stock_class_id,
                params.quantity,
                params.share_price
            );
        } else {
            // Update the existing NFT with new position details
            IActivePositionNFT(nftAddress).updatePosition(tokenId, params.quantity, params.share_price);
        }

        emit StockIssued(params.stakeholder_id, params.stock_class_id, params.quantity, params.share_price);
    }

    function generateTokenId(bytes16 stakeholderId, bytes16 stockClassId) internal pure returns (uint256) {
        // Token ID generation logic; typically a hash or unique combination of IDs
        return uint256(keccak256(abi.encodePacked(stakeholderId, stockClassId)));
    }
}
