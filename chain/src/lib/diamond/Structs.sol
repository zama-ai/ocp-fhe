// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct Issuer {
    bytes16 id;
    uint256 shares_issued;
    uint256 shares_authorized;
}

// can be later extended to add things like seniority, conversion_rights, etc.
struct StockClass {
    bytes16 id;
    string class_type; // ["COMMON", "PREFERRED"]
    uint256 price_per_share; // Per-share price this stock class was issued for
    uint256 shares_issued;
    uint256 shares_authorized;
}

struct StockPlan {
    bytes16[] stock_class_ids;
    uint256 shares_reserved;
}

struct StockActivePosition {
    bytes16 stock_class_id;
    uint256 quantity;
    uint256 share_price;
}

struct StockActivePositions {
    mapping(bytes16 => bytes16[]) stakeholderToSecurities; // Stakeholder ID -> List of Security IDs
    mapping(bytes16 => StockActivePosition) securities; // Security ID -> ActivePosition
}

struct ConvertibleActivePosition {
    uint256 investment_amount;
    // uint256 valuation_cap; // unsure we want to store this
    // uint256 discount_rate; // unsure we want to store this
    // string convertible_type; // ["NOTE", "SAFE"] // do we even care?
    uint40 timestamp;
}

struct ConvertibleActivePositions {
    mapping(bytes16 => bytes16[]) stakeholderToSecurities; // Stakeholder ID -> List of Security IDs
    mapping(bytes16 => ConvertibleActivePosition) securities; // Security ID -> ActivePosition
}

struct EquityCompensationActivePosition {
    uint256 quantity;
    uint40 timestamp;
    bytes16 stock_class_id;
    bytes16 stock_plan_id;
}

struct EquityCompensationActivePositions {
    mapping(bytes16 => bytes16[]) stakeholderToSecurities; // Stakeholder ID -> List of Security IDs
    mapping(bytes16 => EquityCompensationActivePosition) securities; // Security ID -> ActivePosition
}
