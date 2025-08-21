// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";

import { StorageLib, Storage } from "src/core/Storage.sol";
import { PrivateStockActivePosition,IssuePrivateStockParams } from "src/libraries/Structs.sol";
import { TxHelper, TxType } from "src/libraries/TxHelper.sol";
import { AccessControl } from "src/libraries/AccessControl.sol";
import { IPrivateStockFacet } from "src/interfaces/IPrivateStockFacet.sol";
import {ZamaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract PrivateStockFacet is IPrivateStockFacet, Initializable {


    function initialize() public initializer {
        FHE.setCoprocessor(ZamaConfig.getSepoliaConfig());
        FHE.setDecryptionOracle(ZamaConfig.getSepoliaOracleAddress());
    }

    function issuePrivateStockInternal(IssuePrivateStockParams calldata params, bytes calldata inputProof) internal {
        Storage storage ds = StorageLib.get();

        // Create stock position
        PrivateStockActivePosition memory position = PrivateStockActivePosition({
            stakeholder_address: params.stakeholder_address,
            stock_class_id: params.stock_class_id,
            quantity: FHE.fromExternal(params.quantity, inputProof),
            share_price: FHE.fromExternal(params.share_price, inputProof),
            pre_money_valuation: FHE.fromExternal(params.pre_money_valuation, inputProof)
        });

        FHE.allowThis(position.quantity);
        FHE.allow(position.quantity, msg.sender);
        FHE.allow(position.quantity, params.stakeholder_address);

        FHE.allowThis(position.share_price);
        FHE.allow(position.share_price, msg.sender);
        FHE.allow(position.share_price, params.stakeholder_address);

        FHE.allowThis(position.pre_money_valuation);
        FHE.allow(position.pre_money_valuation, msg.sender);
        FHE.allow(position.pre_money_valuation, params.stakeholder_address);

        euint64 positionValue = FHE.mul(position.share_price, position.quantity);
        ds.round_total_amount[params.round_id] = FHE.add(ds.round_total_amount[params.round_id], positionValue);

        FHE.allowThis(ds.round_total_amount[params.round_id]);
        FHE.allow(ds.round_total_amount[params.round_id], msg.sender);
        FHE.allow(ds.round_total_amount[params.round_id], params.stakeholder_address);

        // Store the position
        ds._privateStockActivePositions.securities[params.security_id] = position;

        // Add to stakeholder's securities
        ds._privateStockActivePositions.stakeholderToSecurities[params.stakeholder_address].push(params.security_id);

        // Update security to stakeholder mapping
        ds._privateStockActivePositions.securityToStakeholder[params.security_id] = params.stakeholder_address;
    }

    function issuePrivateStocks(IssuePrivateStockParams[] calldata params, bytes calldata inputProof) external {

        if (!AccessControl.hasAdminRole(msg.sender)) {
            revert AccessControl.AccessControlUnauthorized(msg.sender, AccessControl.DEFAULT_ADMIN_ROLE);
        }

        for(uint256 i = 0; i < params.length; i++) {
            issuePrivateStockInternal(params[i], inputProof);
        }
    }


    /// @notice Get details of a stock position
    /// @dev Accessible to INVESTOR_ROLE and above
    function getPrivateStockPosition(bytes16 securityId) external view returns (PrivateStockActivePosition memory) {
        Storage storage ds = StorageLib.get();
        return ds._privateStockActivePositions.securities[securityId];
    }

    /// @dev Private helper to get stakeholder securities
    function _getPrivateStakeholderSecurities(
        address stakeholder_address,
        bytes16 stock_class_id
    )
        private
        view
        returns (bytes16[] memory)
    {
        Storage storage ds = StorageLib.get();

        bytes16[] storage allSecurities = ds._privateStockActivePositions.stakeholderToSecurities[stakeholder_address];
        bytes16[] memory matchingSecurities = new bytes16[](allSecurities.length);
        uint256 matchCount = 0;

        for (uint256 i = 0; i < allSecurities.length; i++) {
            if (ds._privateStockActivePositions.securities[allSecurities[i]].stock_class_id == stock_class_id) {
                matchingSecurities[matchCount] = allSecurities[i];
                matchCount++;
            }
        }

        // Resize array to actual match count
        bytes16[] memory result = new bytes16[](matchCount);
        for (uint256 i = 0; i < matchCount; i++) {
            result[i] = matchingSecurities[i];
        }

        return result;
    }

    /// @notice Get all security IDs for a stakeholder of a specific stock class
    /// @dev Accessible to INVESTOR_ROLE and above. Investors can only view their own positions
    function getPrivateStakeholderSecurities(
        address stakeholder_address,
        bytes16 stock_class_id
    )
        external
        view
        returns (bytes16[] memory)
    {
        return _getPrivateStakeholderSecurities(stakeholder_address, stock_class_id);
    }

    /// @notice Get the total amount for a specific round
    function getRoundTotalAmount(bytes16 round_id) external view returns (euint64) {
        Storage storage ds = StorageLib.get();
        return ds.round_total_amount[round_id];
    }
}
