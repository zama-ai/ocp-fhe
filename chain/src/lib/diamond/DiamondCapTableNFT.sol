// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "diamond-3-hardhat/libraries/LibDiamond.sol";
import { IDiamondCut } from "diamond-3-hardhat/interfaces/IDiamondCut.sol";
import { Diamond } from "diamond-3-hardhat/Diamond.sol";
import { StorageLibV2 } from "../StorageV2.sol";
import { StorageV2, Issuer, Stakeholder, StockClass } from "../Structs.sol";

contract DiamondCapTableNFT is Diamond {
    constructor(address _contractOwner, address _diamondCutFacet) Diamond(_contractOwner, _diamondCutFacet) {
        // Initialize any additional CapTable specific state here if needed
    }

    event StakeholderCreated(bytes16 indexed id);
    event StockClassCreated(bytes16 indexed id, string indexed classType, uint256 indexed pricePerShare, uint256 initialSharesAuthorized);

    // Errors
    error StakeholderAlreadyExists(bytes16 stakeholder_id);
    error StockClassAlreadyExists(bytes16 stock_class_id);

    function initializeIssuer(bytes16 id, uint256 initial_shares_authorized) external {
        LibDiamond.enforceIsContractOwner();
        StorageV2 storage ds = StorageLibV2.get();

        // Ensure issuer hasn't been initialized
        require(ds.issuer.shares_authorized == 0, "Issuer already initialized");

        ds.issuer = Issuer({ id: id, shares_issued: 0, shares_authorized: initial_shares_authorized });
    }

    function createStakeholder(bytes16 _id, string memory _stakeholder_type, string memory _current_relationship) external {
        StorageV2 storage ds = StorageLibV2.get();

        if (ds.stakeholderIndex[_id] > 0) {
            revert StakeholderAlreadyExists(_id);
        }

        ds.stakeholders.push(Stakeholder(_id, _stakeholder_type, _current_relationship));
        ds.stakeholderIndex[_id] = ds.stakeholders.length;
        emit StakeholderCreated(_id);
    }

    function createStockClass(bytes16 _id, string memory _class_type, uint256 _price_per_share, uint256 _initial_share_authorized) external {
        StorageV2 storage ds = StorageLibV2.get();

        if (ds.stockClassIndex[_id] > 0) {
            revert StockClassAlreadyExists(_id);
        }

        ds.stockClasses.push(
            StockClass({
                id: _id,
                class_type: _class_type,
                price_per_share: _price_per_share,
                shares_issued: 0,
                shares_authorized: _initial_share_authorized
            })
        );

        ds.stockClassIndex[_id] = ds.stockClasses.length;
        emit StockClassCreated(_id, _class_type, _price_per_share, _initial_share_authorized);
    }

    function setActivePositionNFT(address _nftAddress) external {
        LibDiamond.enforceIsContractOwner();
        StorageV2 storage ds = StorageLibV2.get();

        require(_nftAddress != address(0), "Invalid NFT address");
        ds.activePositionNFT = _nftAddress;
    }
}
