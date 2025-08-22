// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { PrivateStockActivePosition, IssuePrivateStockParams } from "src/libraries/Structs.sol";
import { euint64 } from "@fhevm/solidity/lib/FHE.sol";

interface IPrivateStockFacet {
    error EmptyParams();

    /// @notice Issue new stock to a stakeholder
    /// @dev Only OPERATOR_ROLE can issue stock
    /// @param params Parameters for issuing stock including stakeholder Address, stock class ID, quantity, etc.

    function issuePrivateStocks(IssuePrivateStockParams[] calldata params, bytes calldata inputProof) external;

    /// @notice Get details of a stock position
    /// @dev Accessible to INVESTOR_ROLE and above. Investors can only view their own positions
    /// @param securityId The ID of the security to get details for
    /// @return The stock position details
    function getPrivateStockPosition(bytes16 securityId) external view returns (PrivateStockActivePosition memory);

    /// @notice Get all security IDs for a stakeholder of a specific stock class
    /// @dev Accessible to INVESTOR_ROLE and above. Investors can only view their own positions
    /// @param stakeholder_address The stakeholder to get securities for
    /// @param stock_class_id The stock class to filter by
    /// @return Array of security IDs belonging to the stakeholder for the given stock class
    function getPrivateStakeholderSecurities(
        address stakeholder_address,
        bytes16 stock_class_id
    )
        external
        view
        returns (bytes16[] memory);

    /// @notice Get the total amount for a specific round
    /// @param round_id The ID of the round to get total amount for
    /// @return The total amount for the round
    function getRoundTotalAmount(bytes16 round_id) external view returns (euint64);

    /// @notice Get the pre-money valuation for a specific round
    /// @param round_id The ID of the round to get pre-money valuation for
    /// @return The pre-money valuation for the round
    function getRoundPreMoneyValuation(bytes16 round_id) external view returns (euint64);

    /// @notice Transfer stock from one stakeholder to another
    /// @dev Only OPERATOR_ROLE can transfer stock
    /// @param transferor_stakeholder_address The stakeholder transferring the stock
    /// @param transferee_stakeholder_address The stakeholder receiving the stock
    /// @param stock_class_id The stock class being transferred
    /// @param quantity The number of shares to transfer
    /// @param share_price The price per share for the transfer
    // function transferStock(
    //    address transferor_stakeholder_address,
    //    address transferee_stakeholder_address,
    //    bytes16 stock_class_id,
    //    uint256 quantity,
    //    uint256 share_price
    //)
    //    external;

    /// @notice Cancel stock from a stakeholder
    /// @dev Only OPERATOR_ROLE can cancel stock
    /// @param id The issuer of the stock
    /// @param security_id The ID of the cancellation
    /// @param quantity The quantity of shares to cancel
    //function cancelStock(bytes16 id, bytes16 security_id, uint256 quantity) external;
}
