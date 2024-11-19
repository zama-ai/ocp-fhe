// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondTestBase.sol";
import "@diamond/Storage.sol";

contract DiamondConvertibleIssuanceTest is DiamondTestBase {
    event TxCreated(uint256 index, TxType txType, bytes txData);

    function testIssueConvertible() public {
        bytes16 stakeholderId = createStakeholder();

        ConvertibleParams memory params = ConvertibleParams({
            stakeholder_id: stakeholderId,
            investment_amount: 1000000000000, // $1M in smallest units
            convertible_type: "NOTE",
            valuation_cap: 10000000000000, // $10M cap
            discount_rate: 20 // 20% discount
        });

        Storage storage s = StorageLib.get();
        bytes16 id = TxHelper.generateDeterministicUniqueID(stakeholderId, s.nonce + 1);
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(id, s.nonce + 1);

        ConvertibleIssuance memory issuance = ConvertibleIssuance({
            id: id,
            object_type: "TX_CONVERTIBLE_ISSUANCE",
            security_id: securityId,
            params: params
        });

        // Expect the TxCreated event with exact parameters
        vm.expectEmit(true, true, false, true, address(diamond));
        emit TxHelper.TxCreated(1, TxType.CONVERTIBLE_ISSUANCE, abi.encode(issuance));

        ConvertiblesFacet(address(diamond)).issueConvertible(params);

        // Verify the convertible position was created
        ConvertiblePosition memory position = ConvertiblesFacet(address(diamond)).getPosition(stakeholderId, securityId);
        assertEq(position.investment_amount, params.investment_amount);
        assertEq(position.convertible_type, params.convertible_type);
        assertEq(position.valuation_cap, params.valuation_cap);
        assertEq(position.discount_rate, params.discount_rate);
    }
}
