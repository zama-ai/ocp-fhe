// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { StorageLib, Storage } from "src/core/Storage.sol";
import {
    StockActivePosition,
    WarrantActivePosition,
    ConvertibleActivePosition,
    EquityCompensationActivePosition,
    StakeholderPositions
} from "src/libraries/Structs.sol";
import { AccessControl } from "src/libraries/AccessControl.sol";
import { IStakeholderFacet } from "src/interfaces/IStakeholderFacet.sol";

contract StakeholderFacet is IStakeholderFacet {
    /// @notice Create a new stakeholder
    /// @dev Only OPERATOR_ROLE can create stakeholders
    function createStakeholder(bytes16 _id) external {
        Storage storage ds = StorageLib.get();

        if (!AccessControl.hasOperatorRole(msg.sender)) {
            revert AccessControl.AccessControlUnauthorized(msg.sender, AccessControl.OPERATOR_ROLE);
        }

        if (ds.stakeholderIndex[_id] > 0) {
            revert StakeholderAlreadyExists(_id);
        }

        ds.stakeholders.push(_id);
        ds.stakeholderIndex[_id] = ds.stakeholders.length;

        emit StakeholderCreated(_id);
    }

    /// @notice Link a wallet address to a stakeholder
    /// @dev Only OPERATOR_ROLE can link addresses
    function linkStakeholderAddress(bytes16 stakeholder_id, address wallet_address) external {
        Storage storage ds = StorageLib.get();

        if (!AccessControl.hasOperatorRole(msg.sender)) {
            revert AccessControl.AccessControlUnauthorized(msg.sender, AccessControl.OPERATOR_ROLE);
        }

        // Check if address is already linked
        if (ds.addressToStakeholderId[wallet_address] != bytes16(0)) {
            revert AddressAlreadyLinked(wallet_address);
        }

        // Link the address to stakeholder ID
        ds.addressToStakeholderId[wallet_address] = stakeholder_id;

        emit StakeholderAddressLinked(stakeholder_id, wallet_address);
    }
    /// @notice Get stakeholder id for a given address

    function getStakeholderId(address wallet_address, bool ensure_exists) external view returns (bytes16) {
        Storage storage ds = StorageLib.get();

        // Check if address is linked to a stakeholder
        bytes16 stakeholder_id = ds.addressToStakeholderId[wallet_address];
        if (ensure_exists && stakeholder_id == bytes16(0)) {
            revert NoStakeholder();
        }
        return stakeholder_id;
    }

    /// @notice Get stakeholder idx for a stakeholder id
    function getStakeholderIndex(bytes16 stakeholder_id) external view returns (uint256) {
        return StorageLib.get().stakeholderIndex[stakeholder_id];
    }

    /// @notice Get all positions for a stakeholder
    /// @dev INVESTOR_ROLE can only view their own positions, OPERATOR_ROLE and above can view any
    function getStakeholderPositions(bytes16 stakeholder_id) external view returns (StakeholderPositions memory) {
        Storage storage ds = StorageLib.get();

        // Check that caller has at least investor role
        if (
            !AccessControl.hasAdminRole(msg.sender) && !AccessControl.hasOperatorRole(msg.sender)
                && !AccessControl.hasInvestorRole(msg.sender)
        ) {
            revert AccessControl.AccessControlUnauthorizedOrInvestor(msg.sender);
        }

        // If caller is an investor, they can only view their own positions
        if (
            AccessControl.hasInvestorRole(msg.sender) && !AccessControl.hasOperatorRole(msg.sender)
                && !AccessControl.hasAdminRole(msg.sender)
        ) {
            require(ds.addressToStakeholderId[msg.sender] == stakeholder_id, "Can only view own positions");
        }

        StakeholderPositions memory positions;

        // Populate stocks
        bytes16[] storage stockSecurities = ds.stockActivePositions.stakeholderToSecurities[stakeholder_id];
        positions.stocks = new StockActivePosition[](stockSecurities.length);
        for (uint256 i = 0; i < stockSecurities.length; i++) {
            positions.stocks[i] = ds.stockActivePositions.securities[stockSecurities[i]];
        }

        // Populate warrants
        bytes16[] storage warrantSecurities = ds.warrantActivePositions.stakeholderToSecurities[stakeholder_id];
        positions.warrants = new WarrantActivePosition[](warrantSecurities.length);
        for (uint256 i = 0; i < warrantSecurities.length; i++) {
            positions.warrants[i] = ds.warrantActivePositions.securities[warrantSecurities[i]];
        }

        // Populate convertibles
        bytes16[] storage convertibleSecurities = ds.convertibleActivePositions.stakeholderToSecurities[stakeholder_id];
        positions.convertibles = new ConvertibleActivePosition[](convertibleSecurities.length);
        for (uint256 i = 0; i < convertibleSecurities.length; i++) {
            positions.convertibles[i] = ds.convertibleActivePositions.securities[convertibleSecurities[i]];
        }

        // Populate equity compensations
        bytes16[] storage equityCompSecurities =
            ds.equityCompensationActivePositions.stakeholderToSecurities[stakeholder_id];
        positions.equityCompensations = new EquityCompensationActivePosition[](equityCompSecurities.length);
        for (uint256 i = 0; i < equityCompSecurities.length; i++) {
            positions.equityCompensations[i] = ds.equityCompensationActivePositions.securities[equityCompSecurities[i]];
        }

        return positions;
    }
}
