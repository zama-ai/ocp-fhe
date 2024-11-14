// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "../../lib/diamond-3-hardhat/contracts/libraries/LibDiamond.sol";

contract StockFacet {
    // Core structs
    struct StockIssuanceParams {
        bytes16 stock_class_id;
        bytes16 stock_plan_id;
        ShareNumbersIssued share_numbers_issued;
        uint256 share_price;
        uint256 quantity;
        bytes16 vesting_terms_id;
        uint256 cost_basis;
        bytes16[] stock_legend_ids;
        string issuance_type;
        string[] comments;
        string custom_id;
        bytes16 stakeholder_id;
        string board_approval_date;
        string stockholder_approval_date;
        string consideration_text;
        SecurityLawExemption[] security_law_exemptions;
    }

    struct ShareNumbersIssued {
        uint256 start_number;
        uint256 end_number;
    }

    struct SecurityLawExemption {
        string law_type;
        string description;
    }

    struct ActivePosition {
        bytes16 stock_class_id;
        uint256 quantity;
        uint256 share_price;
        uint40 timestamp;
    }

    struct Stakeholder {
        bytes16 id;
        string stakeholder_type;
        string current_relationship;
    }

    struct StockClass {
        bytes16 id;
        string class_type;
        uint256 price_per_share;
        uint256 shares_issued;
        uint256 shares_authorized;
    }

    struct Issuer {
        bytes16 id;
        uint256 shares_issued;
        uint256 shares_authorized;
    }

    // Diamond Storage
    struct DiamondStorage {
        mapping(bytes16 => mapping(bytes16 => ActivePosition)) activePositions;
        mapping(bytes16 => mapping(bytes16 => bytes16[])) activeSecurityIdsByStockClass;
        bytes[] transactions;
        Issuer issuer;
        Stakeholder[] stakeholders;
        StockClass[] stockClasses;
        mapping(bytes16 => uint256) stakeholderIndex;
        mapping(bytes16 => uint256) stockClassIndex;
    }

    bytes32 constant _DIAMOND_STORAGE_POSITION = keccak256("diamond.storage.stock");

    function _diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    // Events
    event StockIssued(bytes16 indexed stakeholderId, bytes16 indexed stockClassId, uint256 quantity, uint256 sharePrice);
    event StakeholderCreated(bytes16 indexed id);
    event StockClassCreated(bytes16 indexed id, string indexed classType, uint256 indexed pricePerShare, uint256 initialSharesAuthorized);

    // Errors
    error StakeholderAlreadyExists(bytes16 stakeholder_id);
    error StockClassAlreadyExists(bytes16 stock_class_id);
    error NoStakeholder(bytes16 stakeholder_id);
    error InvalidStockClass(bytes16 stock_class_id);

    function initializeIssuer(bytes16 id, uint256 initial_shares_authorized) external {
        LibDiamond.enforceIsContractOwner();
        DiamondStorage storage ds = diamondStorage();

        // Ensure issuer hasn't been initialized
        require(ds.issuer.shares_authorized == 0, "Issuer already initialized");

        ds.issuer = Issuer({ id: id, shares_issued: 0, shares_authorized: initial_shares_authorized });
    }

    function createStakeholder(bytes16 _id, string memory _stakeholder_type, string memory _current_relationship) external {
        DiamondStorage storage ds = diamondStorage();

        if (ds.stakeholderIndex[_id] > 0) {
            revert StakeholderAlreadyExists(_id);
        }

        ds.stakeholders.push(Stakeholder(_id, _stakeholder_type, _current_relationship));
        ds.stakeholderIndex[_id] = ds.stakeholders.length;
        emit StakeholderCreated(_id);
    }

    function createStockClass(bytes16 _id, string memory _class_type, uint256 _price_per_share, uint256 _initial_share_authorized) external {
        DiamondStorage storage ds = diamondStorage();

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

    function issueStock(StockIssuanceParams calldata params) external {
        DiamondStorage storage ds = diamondStorage();

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
        DiamondStorage storage ds = diamondStorage();
        if (ds.stakeholderIndex[_id] == 0) {
            revert NoStakeholder(_id);
        }
    }

    function _checkInvalidStockClass(bytes16 _stock_class_id) internal view {
        DiamondStorage storage ds = diamondStorage();
        if (ds.stockClassIndex[_stock_class_id] == 0) {
            revert InvalidStockClass(_stock_class_id);
        }
    }
}
