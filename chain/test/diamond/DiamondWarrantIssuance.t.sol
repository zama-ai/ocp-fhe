// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondTestBase.sol";
import { StorageLib } from "@diamond/Storage.sol";
import { TxHelper, TxType } from "@diamond/DiamondTxHelper.sol";
import { ValidationLib } from "@diamond/libraries/ValidationLib.sol";
import { WarrantActivePosition } from "@diamond/Structs.sol";

contract DiamondWarrantIssuanceTest is DiamondTestBase {
    function testIssueWarrant() public {
        bytes16 stakeholderId = createStakeholder();
        uint256 quantity = 1000;

        Storage storage s = StorageLib.get();
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stakeholderId, s.nonce + 1);

        vm.expectEmit(true, true, false, true, address(diamond));
        emit TxHelper.TxCreated(TxType.WARRANT_ISSUANCE, abi.encode(stakeholderId, quantity, securityId));

        WarrantFacet(address(diamond)).issueWarrant(stakeholderId, quantity);

        // Verify position was created correctly
        WarrantActivePosition memory position = WarrantFacet(address(diamond)).getWarrantPosition(securityId);
        assertEq(position.quantity, quantity);
    }

    function testFailInvalidStakeholder() public {
        bytes16 invalidStakeholderId = 0xd3373e0a4dd940000000000000000099;

        vm.expectRevert(abi.encodeWithSelector(ValidationLib.NoStakeholder.selector, invalidStakeholderId));
        WarrantFacet(address(diamond)).issueWarrant(invalidStakeholderId, 1000);
    }

    function testFailZeroQuantity() public {
        bytes16 stakeholderId = createStakeholder();

        vm.expectRevert(abi.encodeWithSelector(ValidationLib.InvalidQuantity.selector));
        WarrantFacet(address(diamond)).issueWarrant(stakeholderId, 0);
    }
}
