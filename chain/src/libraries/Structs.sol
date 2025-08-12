// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";

struct Issuer {
    bytes16 id;
    uint256 shares_issued;
    uint256 shares_authorized;
}

// can be later extended to add things like seniority, conversion_rights, etc.
struct StockClass {
    bytes16 id;
    string class_type; // ["COMMON", "PREFERRED"]
    uint256 shares_issued;
    uint256 price_per_share;
    uint256 shares_authorized;
}

struct StockPlan {
    bytes16[] stock_class_ids;
    uint256 shares_reserved;
}

struct StockActivePosition {
    bytes16 stakeholder_id;
    bytes16 stock_class_id;
    uint256 quantity;
    uint256 share_price;
}

struct PrivateStockActivePosition {
    address stakeholder_address;
    bytes16 stock_class_id;
    euint64 quantity;
    euint64 share_price;
}

struct PrivateStockActivePositions {
    mapping(address => bytes16[]) stakeholderToSecurities;
    mapping(bytes16 => PrivateStockActivePosition) securities;
    mapping(bytes16 => address) securityToStakeholder;
}

struct StockActivePositions {
    mapping(bytes16 => bytes16[]) stakeholderToSecurities;
    mapping(bytes16 => StockActivePosition) securities;
    mapping(bytes16 => bytes16) securityToStakeholder;
}

struct ConvertibleActivePosition {
    bytes16 stakeholder_id;
    uint256 investment_amount;
}

struct ConvertibleActivePositions {
    mapping(bytes16 => bytes16[]) stakeholderToSecurities;
    mapping(bytes16 => ConvertibleActivePosition) securities;
    mapping(bytes16 => bytes16) securityToStakeholder;
}

struct EquityCompensationActivePosition {
    bytes16 stakeholder_id;
    uint256 quantity;
    uint40 timestamp;
    bytes16 stock_class_id;
    bytes16 stock_plan_id;
}

struct EquityCompensationActivePositions {
    mapping(bytes16 => bytes16[]) stakeholderToSecurities;
    mapping(bytes16 => EquityCompensationActivePosition) securities;
    mapping(bytes16 => bytes16) securityToStakeholder;
}

struct EquityCompensationExercise {
    bytes16 equity_comp_security_id; // The ID of the equity compensation being exercised
    bytes16 resulting_stock_security_id; // The ID of the stock issuance that results from this exercise
    uint256 quantity; // How many shares are being exercised
}

struct WarrantActivePosition {
    bytes16 stakeholder_id;
    uint256 quantity;
}

struct WarrantActivePositions {
    mapping(bytes16 => bytes16[]) stakeholderToSecurities;
    mapping(bytes16 => WarrantActivePosition) securities;
    mapping(bytes16 => bytes16) securityToStakeholder;
}

struct StakeholderPositions {
    StockActivePosition[] stocks;
    WarrantActivePosition[] warrants;
    ConvertibleActivePosition[] convertibles;
    EquityCompensationActivePosition[] equityCompensations;
}

struct IssuePrivateStockParams{
    bytes16 id;
    bytes16 stock_class_id;
    externalEuint64 share_price;
    externalEuint64 quantity;
    address stakeholder_address;
    bytes16 security_id;
    string custom_id;
    string stock_legend_ids_mapping;
    string security_law_exemptions_mapping;
}

struct IssueStockParams {
    bytes16 id;
    bytes16 stock_class_id;
    uint256 share_price;
    uint256 quantity;
    bytes16 stakeholder_id;
    bytes16 security_id;
    string custom_id;
    string stock_legend_ids_mapping;
    string security_law_exemptions_mapping;
}

struct IssueConvertibleParams {
    bytes16 id;
    bytes16 stakeholder_id;
    uint256 investment_amount;
    bytes16 security_id;
    string convertible_type;
    uint256 seniority;
    string custom_id;
    string security_law_exemptions_mapping;
    string conversion_triggers_mapping;
}

struct IssueEquityCompensationParams {
    bytes16 id;
    bytes16 stakeholder_id;
    bytes16 stock_class_id;
    bytes16 stock_plan_id;
    uint256 quantity;
    bytes16 security_id;
    string compensation_type;
    uint256 exercise_price;
    uint256 base_price;
    string expiration_date;
    string custom_id;
    string termination_exercise_windows_mapping;
    string security_law_exemptions_mapping;
}

struct IssueWarrantParams {
    bytes16 id;
    bytes16 stakeholder_id;
    uint256 quantity;
    bytes16 security_id;
    uint256 purchase_price;
    string custom_id;
    string security_law_exemptions_mapping;
    string exercise_triggers_mapping;
}

struct StockConsolidationTx {
    bytes16[] security_ids;
    bytes16 resulting_security_id;
}

struct StockTransferTx {
    bytes16 consolidated_security_id;
    bytes16 transferee_security_id;
    bytes16 remainder_security_id;
    uint256 quantity;
    uint256 share_price;
}

struct StockCancellationTx {
    bytes16 id;
    bytes16 security_id;
    bytes16 balance_security_id;
    uint256 quantity;
}
