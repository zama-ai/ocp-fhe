// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondTestBase.sol";

import { EquityCompensationActivePosition } from "@diamond/Structs.sol";
import { TxHelper, TxType } from "@diamond/DiamondTxHelper.sol";

contract DiamondEquityCompensationIssuanceTest is DiamondTestBase {
    function createStockClassStakeholderAndPlan() public returns (bytes16, bytes16, bytes16) {
        bytes16 stakeholderId = 0xd3373e0a4dd940000000000000000005;
        bytes16 stockClassId = 0xd3373e0a4dd940000000000000000000;
        bytes16 stockPlanId = 0xd3373e0a4dd940000000000000000001;

        // Create stakeholder
        vm.expectEmit(true, false, false, false, address(diamond));
        emit StakeholderCreated(stakeholderId);
        StakeholderFacet(payable(address(diamond))).createStakeholder(stakeholderId);

        // Create stock class
        vm.expectEmit(true, true, false, false, address(diamond));
        emit StockClassCreated(stockClassId, "COMMON", 100, 100000);
        StockClassFacet(payable(address(diamond))).createStockClass(stockClassId, "COMMON", 100, 100000);

        // Create stock plan
        bytes16[] memory stockClassIds = new bytes16[](1);
        stockClassIds[0] = stockClassId;

        vm.expectEmit(true, false, false, false, address(diamond));
        emit StockPlanCreated(stockPlanId, 10000);
        StockPlanFacet(payable(address(diamond))).createStockPlan(stockPlanId, stockClassIds, 10000);

        return (stockClassId, stakeholderId, stockPlanId);
    }

    function testIssueEquityCompensation() public {
        (bytes16 stockClassId, bytes16 stakeholderId, bytes16 stockPlanId) = createStockClassStakeholderAndPlan();

        Storage storage s = StorageLib.get();
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stakeholderId, s.nonce + 1);

        uint256 quantity = 1000;

        vm.expectEmit(true, true, false, true, address(diamond));
        emit TxHelper.TxCreated(TxType.EQUITY_COMPENSATION_ISSUANCE, abi.encode(stakeholderId, stockClassId, stockPlanId, quantity, securityId));

        EquityCompensationFacet(address(diamond)).issueEquityCompensation(stakeholderId, stockClassId, stockPlanId, quantity);

        // Verify position was created correctly
        EquityCompensationActivePosition memory position = EquityCompensationFacet(address(diamond)).getPosition(securityId);
        assertEq(position.quantity, quantity);
        assertEq(position.stock_class_id, stockClassId);
        assertEq(position.stock_plan_id, stockPlanId);
    }

    function testFailInvalidStakeholder() public {
        bytes16 invalidStakeholderId = 0xd3373e0a4dd940000000000000000099;
        bytes16 stockClassId = 0xd3373e0a4dd940000000000000000000;
        bytes16 stockPlanId = 0xd3373e0a4dd940000000000000000001;

        EquityCompensationFacet(address(diamond)).issueEquityCompensation(invalidStakeholderId, stockClassId, stockPlanId, 1000);
    }

    function testFailInvalidStockClass() public {
        (, bytes16 stakeholderId, bytes16 stockPlanId) = createStockClassStakeholderAndPlan();
        bytes16 invalidStockClassId = 0xd3373e0a4dd940000000000000000099;

        EquityCompensationFacet(address(diamond)).issueEquityCompensation(stakeholderId, invalidStockClassId, stockPlanId, 1000);
    }

    function testFailInvalidStockPlan() public {
        (bytes16 stockClassId, bytes16 stakeholderId, ) = createStockClassStakeholderAndPlan();
        bytes16 invalidStockPlanId = 0xd3373e0a4dd940000000000000000099;

        EquityCompensationFacet(address(diamond)).issueEquityCompensation(stakeholderId, stockClassId, invalidStockPlanId, 1000);
    }

    function testFailZeroQuantity() public {
        (bytes16 stockClassId, bytes16 stakeholderId, bytes16 stockPlanId) = createStockClassStakeholderAndPlan();

        EquityCompensationFacet(address(diamond)).issueEquityCompensation(stakeholderId, stockClassId, stockPlanId, 0);
    }
}
