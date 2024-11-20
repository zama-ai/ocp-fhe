// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondTestBase.sol";
import { StorageLib } from "@diamond/Storage.sol";
import { TxHelper, TxType } from "@diamond/DiamondTxHelper.sol";
import { ConvertibleActivePosition } from "@diamond/Structs.sol";

contract DiamondConvertibleIssuanceTest is DiamondTestBase {
    function testIssueConvertible() public {
        bytes16 stakeholderId = createStakeholder();

        Storage storage s = StorageLib.get();
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stakeholderId, s.nonce + 1);

        uint256 investment_amount = 1000000000000; // $1M in smallest units

        vm.expectEmit(true, true, false, true, address(diamond));
        emit TxHelper.TxCreated(TxType.CONVERTIBLE_ISSUANCE, abi.encode(stakeholderId, investment_amount, securityId));

        ConvertiblesFacet(address(diamond)).issueConvertible(stakeholderId, investment_amount);

        // Verify position was created correctly
        ConvertibleActivePosition memory position = ConvertiblesFacet(address(diamond)).getPosition(securityId);
        assertEq(position.investment_amount, investment_amount);
    }

    function testFailInvalidStakeholder() public {
        bytes16 invalidStakeholderId = 0xd3373e0a4dd940000000000000000099;
        uint256 investment_amount = 1000000000000;

        ConvertiblesFacet(address(diamond)).issueConvertible(invalidStakeholderId, investment_amount);
    }

    function testFailZeroAmount() public {
        bytes16 stakeholderId = createStakeholder();

        ConvertiblesFacet(address(diamond)).issueConvertible(stakeholderId, 0);
    }
}
