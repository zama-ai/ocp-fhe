// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Storage, StorageLib } from "src/core/Storage.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IAccessControlFacet } from "src/interfaces/IAccessControlFacet.sol";

contract AccessControlFacet is AccessControlUpgradeable, IAccessControlFacet {
    // Role definitions
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE"); // For protocols and issuer
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE"); // For shareholders/stakeholders

    /// @notice Initialize the access control system
    /// @dev Sets up initial roles. The deployer (CapTableFactory) gets admin role
    function initializeAccessControl() external {
        Storage storage ds = StorageLib.get();

        // Set up admin role for the deployer (factory)
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        ds.currentAdmin = msg.sender; // Set initial admin

        // Set up role admins using helper function
        _setRoleAdmin(OPERATOR_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(INVESTOR_ROLE, DEFAULT_ADMIN_ROLE);

        // Note: We don't need to explicitly grant OPERATOR and INVESTOR roles
        // because _grantRole automatically grants them when granting DEFAULT_ADMIN_ROLE
    }

    /// @dev Override hasRole to use diamond storage
    function hasRole(
        bytes32 role,
        address account
    )
        public
        view
        virtual
        override(AccessControlUpgradeable, IAccessControlFacet)
        returns (bool)
    {
        return StorageLib.get().roles[role][account];
    }

    /// @dev Override getRoleAdmin to use diamond storage
    function getRoleAdmin(bytes32 role)
        public
        view
        virtual
        override(AccessControlUpgradeable, IAccessControlFacet)
        returns (bytes32)
    {
        return StorageLib.get().roleAdmin[role];
    }

    /// @notice Grants `role` to `account`
    /// @dev Caller must have admin role for `role`
    function grantRole(
        bytes32 role,
        address account
    )
        public
        virtual
        override(AccessControlUpgradeable, IAccessControlFacet)
    {
        if (!hasRole(getRoleAdmin(role), msg.sender)) {
            revert AccessControlUnauthorized(msg.sender, getRoleAdmin(role));
        }
        _grantRole(role, account);
    }

    /// @notice Revokes `role` from `account`
    /// @dev Caller must have admin role for `role`
    function revokeRole(
        bytes32 role,
        address account
    )
        public
        virtual
        override(AccessControlUpgradeable, IAccessControlFacet)
    {
        if (!hasRole(getRoleAdmin(role), msg.sender)) {
            revert AccessControlUnauthorized(msg.sender, getRoleAdmin(role));
        }
        _revokeRole(role, account);
    }

    /// @notice Renounces `role` for the calling account
    /// @dev Calling account must have the role
    function renounceRole(
        bytes32 role,
        address account
    )
        public
        virtual
        override(AccessControlUpgradeable, IAccessControlFacet)
    {
        if (account != msg.sender) {
            revert AccessControlBadConfirmation();
        }
        _revokeRole(role, account);
    }

    /// @dev Override _grantRole to use diamond storage
    function _grantRole(bytes32 role, address account) internal virtual override returns (bool) {
        Storage storage ds = StorageLib.get();
        if (!ds.roles[role][account]) {
            ds.roles[role][account] = true;
            emit RoleGranted(role, account, msg.sender);

            // If granting admin role, also grant operator and investor roles
            if (role == DEFAULT_ADMIN_ROLE) {
                if (!ds.roles[OPERATOR_ROLE][account]) {
                    ds.roles[OPERATOR_ROLE][account] = true;
                    emit RoleGranted(OPERATOR_ROLE, account, msg.sender);
                }
                if (!ds.roles[INVESTOR_ROLE][account]) {
                    ds.roles[INVESTOR_ROLE][account] = true;
                    emit RoleGranted(INVESTOR_ROLE, account, msg.sender);
                }
            }
            return true;
        }
        return false;
    }

    /// @dev Override _revokeRole to use diamond storage
    function _revokeRole(bytes32 role, address account) internal virtual override returns (bool) {
        Storage storage ds = StorageLib.get();
        if (ds.roles[role][account]) {
            ds.roles[role][account] = false;
            emit RoleRevoked(role, account, msg.sender);
            return true;
        }
        return false;
    }

    /// @dev Override _setRoleAdmin to use diamond storage
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual override {
        Storage storage ds = StorageLib.get();
        bytes32 previousAdminRole = ds.roleAdmin[role];
        ds.roleAdmin[role] = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /// @notice Initiates transfer of admin role to a new account
    /// @dev Only current admin can initiate transfer
    function transferAdmin(address newAdmin) public virtual {
        Storage storage ds = StorageLib.get();

        // Check zero address first
        if (newAdmin == address(0)) {
            revert AccessControlInvalidTransfer();
        }

        // Then check admin rights
        if (msg.sender != ds.currentAdmin) {
            revert AccessControlUnauthorized(msg.sender, DEFAULT_ADMIN_ROLE);
        }

        // Grant new admin the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, newAdmin);

        ds.pendingAdmin = newAdmin;
    }

    /// @notice Accepts admin role transfer
    /// @dev Must be called by the pending admin
    function acceptAdmin() public virtual {
        Storage storage ds = StorageLib.get();
        if (msg.sender != ds.pendingAdmin) {
            revert AccessControlInvalidTransfer();
        }

        address oldAdmin = ds.currentAdmin;

        // Grant role to new admin first
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        ds.currentAdmin = msg.sender;

        // Revoke from old admin
        _revokeRole(DEFAULT_ADMIN_ROLE, oldAdmin);

        // Clear pending state
        ds.pendingAdmin = address(0);
    }

    /// @notice Returns the current admin address
    /// @return The address of the current admin
    function getAdmin() public view returns (address) {
        return StorageLib.get().currentAdmin;
    }

    /// @notice Returns the pending admin address
    /// @return The address of the pending admin
    function getPendingAdmin() public view returns (address) {
        return StorageLib.get().pendingAdmin;
    }
}
