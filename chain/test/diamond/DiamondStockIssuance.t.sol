// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondTestBase.sol";
import "@diamond/Storage.sol";

contract DiamondStockIssuanceTest is DiamondTestBase {
    function createStockClassAndStakeholder(uint256 sharesAuthorized) public returns (bytes16, bytes16) {
        bytes16 stakeholderId = 0xd3373e0a4dd940000000000000000005;
        bytes16 stockClassId = 0xd3373e0a4dd940000000000000000000;

        vm.expectEmit(true, false, false, false, address(diamond));
        emit StakeholderCreated(stakeholderId);
        StakeholderFacet(payable(address(diamond))).createStakeholder(stakeholderId, "INDIVIDUAL", "EMPLOYEE");

        vm.expectEmit(true, true, false, false, address(diamond));
        emit StockClassCreated(stockClassId, "COMMON", 100, sharesAuthorized);
        StockClassFacet(payable(address(diamond))).createStockClass(stockClassId, "COMMON", 100, sharesAuthorized);

        return (stockClassId, stakeholderId);
    }

    function testIssueStock() public {
        (bytes16 stockClassId, bytes16 stakeholderId) = createStockClassAndStakeholder(100000);

        bytes16[] memory stockLegendIds = new bytes16[](0);
        string[] memory comments = new string[](0);
        SecurityLawExemption[] memory exemptions = new SecurityLawExemption[](0);

        StockIssuanceParams memory params = StockIssuanceParams({
            stock_class_id: stockClassId,
            stock_plan_id: bytes16(0),
            share_numbers_issued: ShareNumbersIssued(0, 0),
            share_price: 10000000000,
            quantity: 1000,
            vesting_terms_id: bytes16(0),
            cost_basis: 5000000000,
            stock_legend_ids: stockLegendIds,
            issuance_type: "RSA",
            comments: comments,
            custom_id: "R2-D2",
            stakeholder_id: stakeholderId,
            board_approval_date: "2023-01-01",
            stockholder_approval_date: "2023-01-02",
            consideration_text: "For services rendered",
            security_law_exemptions: exemptions
        });

        Storage storage s = StorageLib.get();
        bytes16 id = TxHelper.generateDeterministicUniqueID(stakeholderId, s.nonce + 1);
        bytes16 securityId = TxHelper.generateDeterministicUniqueID(stockClassId, s.nonce + 1);

        StockIssuance memory issuance = StockIssuance({ id: id, security_id: securityId, object_type: "TX_STOCK_ISSUANCE", params: params });

        vm.expectEmit(true, true, false, true, address(diamond));
        emit TxHelper.TxCreated(s.transactions.length + 1, TxType.STOCK_ISSUANCE, abi.encode(issuance));

        StockFacet(address(diamond)).issueStock(params);
    }
}
