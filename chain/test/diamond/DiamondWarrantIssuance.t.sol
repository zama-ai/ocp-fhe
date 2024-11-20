// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondTestBase.sol";
import { TxHelper, TxType } from "@diamond/DiamondTxHelper.sol";
import { WarrantFacet } from "@diamond/facets/WarrantFacet.sol";

contract DiamondWarrantIssuanceTest is DiamondTestBase {
    bytes16 public stakeholderId;
    bytes16 public stockClassId;

    function setUp() public override {
        super.setUp();
        stakeholderId = createStakeholder();
        stockClassId = createStockClass();
    }

    function test_IssueWarrant() public {
        uint256 quantity = 1000;
        Storage storage ds = StorageLib.get();

        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stakeholderId, ds.nonce + 1);
        bytes memory expectedTxData = abi.encode(stakeholderId, quantity, securityId);
        vm.expectEmit(true, true, false, true, address(diamond));
        emit TxHelper.TxCreated(TxType.WARRANT_ISSUANCE, expectedTxData);

        WarrantFacet(payable(address(diamond))).issueWarrant(stakeholderId, quantity);
    }

    function test_RevertWhen_InvalidStakeholder() public {
        bytes16 invalidStakeholderId = 0xd3373e0a4dd940000000000000000099;

        vm.expectRevert(abi.encodeWithSelector(WarrantFacet.NoStakeholder.selector, invalidStakeholderId));
        WarrantFacet(payable(address(diamond))).issueWarrant(invalidStakeholderId, 1000);
    }

    function test_RevertWhen_InvalidStockClass() public {
        bytes16 invalidStockClassId = 0xd3373e0a4dd940000000000000000099;

        vm.expectRevert(abi.encodeWithSelector(WarrantFacet.InvalidStockClass.selector, invalidStockClassId));
        WarrantFacet(payable(address(diamond))).issueWarrant(stakeholderId, 1000);
    }
}
