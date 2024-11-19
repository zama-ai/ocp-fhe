// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../Structs.sol";

contract ConvertiblesFacet {
    event ConvertibleIssued(bytes16 indexed stakeholderId, uint256 amount, string convertibleType, uint256 timestamp);

    error InvalidAmount();
    error InvalidStakeholder();

    struct BasicConvertibleParams {
        bytes16 stakeholder_id;
        uint256 amount;
        string convertible_type; // ["NOTE", "SAFE"]
        uint256 valuation_cap;
        uint256 discount_rate;
    }

    function issueConvertible(BasicConvertibleParams calldata params) external {
        if (params.amount == 0) revert InvalidAmount();
        if (params.stakeholder_id == bytes16(0)) revert InvalidStakeholder();

        // Basic validation of convertible type
        require(
            keccak256(abi.encodePacked(params.convertible_type)) == keccak256(abi.encodePacked("NOTE")) ||
                keccak256(abi.encodePacked(params.convertible_type)) == keccak256(abi.encodePacked("SAFE")),
            "Invalid convertible type"
        );

        emit ConvertibleIssued(params.stakeholder_id, params.amount, params.convertible_type, block.timestamp);
    }
}
