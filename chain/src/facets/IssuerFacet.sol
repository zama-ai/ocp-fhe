// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { LibDiamond } from "diamond-3-hardhat/contracts/libraries/LibDiamond.sol";
import { StorageLib, Storage } from "src/core/Storage.sol";
import { Issuer } from "src/libraries/Structs.sol";
import { TxHelper, TxType } from "src/libraries/TxHelper.sol";
import { AccessControl } from "src/libraries/AccessControl.sol";
import { IIssuerFacet } from "src/interfaces/IIssuerFacet.sol";

contract IssuerFacet is IIssuerFacet {
    /// @notice Initialize the issuer with initial shares authorized
    /// @dev Can only be called once by an admin during setup
    function initializeIssuer(bytes16 id, uint256 initial_shares_authorized) external {
        Storage storage ds = StorageLib.get();

        // Check that caller has admin role
        if (!AccessControl.hasAdminRole(msg.sender)) {
            revert AccessControl.AccessControlUnauthorized(msg.sender, AccessControl.DEFAULT_ADMIN_ROLE);
        }

        if (ds.issuer.shares_authorized != 0) {
            revert IssuerAlreadyInitialized();
        }

        ds.issuer = Issuer({ id: id, shares_issued: 0, shares_authorized: initial_shares_authorized });
    }

    /// @notice Getter for the Issuer struct
    function issuer() external view returns (Issuer memory) {
        return StorageLib.get().issuer;
    }

    /// @notice Adjust the total number of authorized shares for the issuer
    /// @dev Only DEFAULT_ADMIN_ROLE can adjust authorized shares
    function adjustIssuerAuthorizedShares(bytes16 id, uint256 newSharesAuthorized) external {
        Storage storage ds = StorageLib.get();

        // Check that caller has admin role
        if (!AccessControl.hasAdminRole(msg.sender)) {
            revert AccessControl.AccessControlUnauthorized(msg.sender, AccessControl.DEFAULT_ADMIN_ROLE);
        }

        // Check that new shares authorized is not less than current shares issued
        require(newSharesAuthorized >= ds.issuer.shares_issued, "New shares authorized must be >= shares issued");

        ds.issuer.shares_authorized = newSharesAuthorized;

        TxHelper.createTx(TxType.ISSUER_AUTHORIZED_SHARES_ADJUSTMENT, abi.encode(id, ds.issuer.id, newSharesAuthorized));
    }
}
