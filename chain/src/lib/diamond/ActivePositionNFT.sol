// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

contract ActivePositionNFT is ERC721 {
    struct Position {
        bytes16 stockClassId;
        uint256 quantity;
        uint256 sharePrice;
        uint40 timestamp;
    }

    mapping(uint256 => Position) public positions; // Maps tokenId to position details
    mapping(bytes16 => uint256) private stakeholderToToken; // Maps stakeholder ID to tokenId
    mapping(bytes16 => uint256[]) private stockClassTokens; // Maps stockClassId to tokenIds

    constructor(string memory issuerName, string memory issuerSymbol) ERC721(issuerName, issuerSymbol) {}

    function mintPosition(address to, uint256 tokenId, bytes16 stakeholderId, bytes16 stockClassId, uint256 quantity, uint256 sharePrice) external {
        require(!_exists(tokenId), "Position already exists");
        require(stakeholderToToken[stakeholderId] == 0, "Stakeholder already has a position");
        _mint(to, tokenId);

        positions[tokenId] = Position({ stockClassId: stockClassId, quantity: quantity, sharePrice: sharePrice, timestamp: uint40(block.timestamp) });

        // Link stakeholder to their token
        stakeholderToToken[stakeholderId] = tokenId;

        // Track token ID by stock class
        stockClassTokens[stockClassId].push(tokenId);
    }

    function updatePosition(bytes16 stakeholderId, uint256 newQuantity, uint256 newSharePrice) external {
        uint256 tokenId = stakeholderToToken[stakeholderId];
        require(_exists(tokenId), "Position does not exist for stakeholder");

        Position storage position = positions[tokenId];
        position.quantity = newQuantity;
        position.sharePrice = newSharePrice;
        position.timestamp = uint40(block.timestamp);
    }

    function getTokenByStakeholder(bytes16 stakeholderId) external view returns (uint256) {
        return stakeholderToToken[stakeholderId];
    }

    function getTokensByStockClass(bytes16 stockClassId) external view returns (uint256[] memory) {
        return stockClassTokens[stockClassId];
    }
}
