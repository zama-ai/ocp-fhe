// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Issuer } from "src/libraries/Structs.sol";

interface IIssuerFacet {
    /// @notice Thrown when trying to initialize an already initialized issuer
    error IssuerAlreadyInitialized();

    /// @notice Thrown when invalid shares authorized value is provided
    error InvalidSharesAuthorized();

    /// @notice Emitted when issuer's authorized shares are adjusted
    event IssuerAuthorizedSharesAdjusted(uint256 newSharesAuthorized);

    /// @notice Initialize the issuer with initial shares authorized
    /// @dev Can only be called once by the factory during setup
    /// @param id The unique identifier for the issuer
    /// @param initial_shares_authorized Initial number of authorized shares
    function initializeIssuer(bytes16 id, uint256 initial_shares_authorized) external;

    /// @notice Getter for the Issuer struct
    function issuer() external view returns (Issuer memory);

    /// @notice Adjust the total number of authorized shares for the issuer
    /// @dev Only DEFAULT_ADMIN_ROLE can adjust authorized shares
    /// @param id The unique identifier for the tx
    /// @param newSharesAuthorized New total number of authorized shares
    function adjustIssuerAuthorizedShares(bytes16 id, uint256 newSharesAuthorized) external;
}
