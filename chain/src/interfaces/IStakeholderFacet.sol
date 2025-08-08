// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    StockActivePosition,
    WarrantActivePosition,
    ConvertibleActivePosition,
    EquityCompensationActivePosition,
    StakeholderPositions
} from "src/libraries/Structs.sol";

interface IStakeholderFacet {
    /// @notice Emitted when a new stakeholder is created
    event StakeholderCreated(bytes16 indexed id);

    /// @notice Emitted when a wallet address is linked to a stakeholder
    event StakeholderAddressLinked(bytes16 indexed stakeholder_id, address indexed wallet_address);

    /// @notice Thrown when attempting to create a stakeholder that already exists
    error StakeholderAlreadyExists(bytes16 stakeholder_id);

    /// @notice Thrown when attempting to link an address that's already linked
    error AddressAlreadyLinked(address wallet_address);

    /// @notice Thrown when no stakeholder exists
    error NoStakeholder();

    /// @notice Create a new stakeholder
    /// @dev Only OPERATOR_ROLE can create stakeholders
    /// @param _id The unique identifier for the stakeholder
    function createStakeholder(bytes16 _id) external;

    /// @notice Link a wallet address to a stakeholder
    /// @dev Only OPERATOR_ROLE can link addresses
    /// @param stakeholder_id The stakeholder to link the address to
    /// @param wallet_address The address to link
    function linkStakeholderAddress(bytes16 stakeholder_id, address wallet_address) external;

    /// @notice Get the stakeholder ID for a given address
    /// @param wallet_address The address to get the stakeholder ID for
    /// @param ensure_exists If true, will revert if the address is not linked to a stakeholder
    function getStakeholderId(address wallet_address, bool ensure_exists) external view returns (bytes16);

    /// @notice Get stakeholder idx for a stakeholder id
    function getStakeholderIndex(bytes16 stakeholder_id) external view returns (uint256);

    /// @notice Get all positions for a stakeholder
    /// @dev INVESTOR_ROLE can only view their own positions, OPERATOR_ROLE and above can view any
    /// @param stakeholder_id The stakeholder to get positions for
    /// @return All positions (stocks, warrants, convertibles, equity compensation) for the stakeholder
    function getStakeholderPositions(bytes16 stakeholder_id) external view returns (StakeholderPositions memory);
}
