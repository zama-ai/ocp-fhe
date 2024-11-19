// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../src/lib/diamond/DiamondCapTableFactory.sol";
import "../../src/facets/StockFacet.sol";
import "diamond-3-hardhat/facets/DiamondCutFacet.sol";
import "diamond-3-hardhat/interfaces/IDiamondCut.sol";
import "../../src/lib/Structs.sol";
import { Diamond } from "diamond-3-hardhat/Diamond.sol";
import { DiamondCapTable } from "../../src/lib/diamond/DiamondCapTable.sol";

contract DiamondStockIssuanceScaleTest is Test {
    uint256 public issuerInitialSharesAuthorized = 10000000;
    bytes16 public issuerId = 0xd3373e0a4dd9430f8a563281f2800e1e;
    address public contractOwner;

    DiamondCutFacet public dcf;
    StockFacet public sf;
    Diamond public diamond;

    event StockIssued(bytes16 indexed stakeholderId, bytes16 indexed stockClassId, uint256 quantity, uint256 sharePrice);
    event StakeholderCreated(bytes16 indexed id);
    event StockClassCreated(bytes16 indexed id, string indexed classType, uint256 indexed pricePerShare, uint256 initialSharesAuthorized);

    function setUp() public {
        contractOwner = address(this);
        dcf = new DiamondCutFacet();
        sf = new StockFacet();
        diamond = new DiamondCapTable(contractOwner, address(dcf));

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory stockSelectors = new bytes4[](1);
        stockSelectors[0] = StockFacet.issueStock.selector;
        cut[0] = IDiamondCut.FacetCut({ facetAddress: address(sf), action: IDiamondCut.FacetCutAction.Add, functionSelectors: stockSelectors });

        DiamondCutFacet(address(diamond)).diamondCut(cut, address(0), "");
        DiamondCapTable(payable(address(diamond))).initializeIssuer(issuerId, issuerInitialSharesAuthorized);
    }

    function createStockClass() public returns (bytes16) {
        bytes16 stockClassId = 0xd3373e0a4dd940000000000000000000;
        DiamondCapTable(payable(address(diamond))).createStockClass(stockClassId, "COMMON", 100, issuerInitialSharesAuthorized);
        return stockClassId;
    }

    function createStakeholder(uint256 index) public returns (bytes16) {
        bytes16 stakeholderId = bytes16(uint128(index + 1));
        DiamondCapTable(payable(address(diamond))).createStakeholder(stakeholderId, "INDIVIDUAL", "EMPLOYEE");
        return stakeholderId;
    }

    function issueStockToStakeholder(bytes16 stockClassId, bytes16 stakeholderId, uint256 quantity) public {
        bytes16[] memory stockLegendIds = new bytes16[](0);
        string[] memory comments = new string[](0);
        SecurityLawExemption[] memory exemptions = new SecurityLawExemption[](0);

        StockIssuanceParams memory params = StockIssuanceParams({
            stock_class_id: stockClassId,
            stock_plan_id: bytes16(0),
            share_numbers_issued: ShareNumbersIssued(0, 0),
            share_price: 10000000000,
            quantity: quantity,
            vesting_terms_id: bytes16(0),
            cost_basis: 5000000000,
            stock_legend_ids: stockLegendIds,
            issuance_type: "RSA",
            comments: comments,
            custom_id: "SCALE-TEST",
            stakeholder_id: stakeholderId,
            board_approval_date: "2023-01-01",
            stockholder_approval_date: "2023-01-02",
            consideration_text: "For services rendered",
            security_law_exemptions: exemptions
        });

        StockFacet(address(diamond)).issueStock(params);
    }

    function testGasScaling() public {
        bytes16 stockClassId = createStockClass();
        uint256 numStakeholders = 1000;
        uint256[] memory gasCosts = new uint256[](numStakeholders);

        // Issue stock to multiple stakeholders and track gas
        for (uint256 i = 0; i < numStakeholders; i++) {
            bytes16 stakeholderId = createStakeholder(i);

            uint256 gasBefore = gasleft();
            issueStockToStakeholder(stockClassId, stakeholderId, 1000);
            uint256 gasUsed = gasBefore - gasleft();

            gasCosts[i] = gasUsed;
            console.log("Issuance %d gas used: %d", i + 1, gasUsed);
        }

        // Calculate average gas cost
        uint256 totalGas = 0;
        for (uint256 i = 0; i < gasCosts.length; i++) {
            totalGas += gasCosts[i];
        }
        console.log("Average gas cost: %d", totalGas / numStakeholders);
    }
}
