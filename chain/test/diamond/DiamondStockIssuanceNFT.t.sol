// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../src/facets/StockFacetV2.sol";
import "../../src/lib/diamond/ActivePositionNFT.sol";
import "diamond-3-hardhat/facets/DiamondCutFacet.sol";
import "diamond-3-hardhat/interfaces/IDiamondCut.sol";
import "../../src/lib/Structs.sol";
import { DiamondCapTableNFT } from "../../src/lib/diamond/DiamondCapTableNFT.sol";

contract DiamondStockIssuanceNFTTest is Test {
    uint256 public issuerInitialSharesAuthorized = 1000000;
    bytes16 public issuerId = 0xd3373e0a4dd9430f8a563281f2800e1e;
    address public contractOwner;

    DiamondCutFacet public diamondCutFacet;
    StockFacetV2 public stockFacet;
    DiamondCapTableNFT public diamond;
    ActivePositionNFT public activePositionNFT;

    event StockIssued(bytes16 indexed stakeholderId, bytes16 indexed stockClassId, uint256 quantity, uint256 sharePrice);
    event StakeholderCreated(bytes16 indexed id);
    event StockClassCreated(bytes16 indexed id, string indexed classType, uint256 indexed pricePerShare, uint256 initialSharesAuthorized);

    function setUp() public {
        // Set contract owner
        contractOwner = address(this);

        // Deploy Diamond facets
        diamondCutFacet = new DiamondCutFacet();
        stockFacet = new StockFacetV2();

        // Deploy DiamondCapTable with DiamondCutFacet
        diamond = new DiamondCapTableNFT(contractOwner, address(diamondCutFacet));

        // Deploy ActivePositionNFT for managing positions
        activePositionNFT = new ActivePositionNFT("Issuer Name", "ISSUE");

        // Link ActivePositionNFT in DiamondCapTable
        DiamondCapTableNFT(payable(address(diamond))).setActivePositionNFT(address(activePositionNFT));

        // Create FacetCut array - only for StockFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);

        // Set StockFacet function selector for issueStock
        bytes4[] memory stockSelectors = new bytes4[](1);
        stockSelectors[0] = StockFacetV2.issueStock.selector;

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(stockFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: stockSelectors
        });

        // Perform the cuts
        DiamondCutFacet(address(diamond)).diamondCut(cut, address(0), "");

        // Initialize issuer
        DiamondCapTableNFT(payable(address(diamond))).initializeIssuer(issuerId, issuerInitialSharesAuthorized);
    }

    function createStockClassAndStakeholder(uint256 sharesAuthorized) public returns (bytes16, bytes16) {
        bytes16 stakeholderId = 0xd3373e0a4dd940000000000000000005;
        bytes16 stockClassId = 0xd3373e0a4dd940000000000000000000;

        // Create stakeholder and stock class
        vm.expectEmit(true, false, false, false, address(diamond));
        emit StakeholderCreated(stakeholderId);
        DiamondCapTableNFT(payable(address(diamond))).createStakeholder(stakeholderId, "INDIVIDUAL", "EMPLOYEE");

        vm.expectEmit(true, true, false, false, address(diamond));
        emit StockClassCreated(stockClassId, "COMMON", 100, sharesAuthorized);
        DiamondCapTableNFT(payable(address(diamond))).createStockClass(stockClassId, "COMMON", 100, sharesAuthorized);

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

        // Expect the StockIssued event with exact parameters
        vm.expectEmit(true, true, false, true, address(diamond));
        emit StockIssued(stakeholderId, stockClassId, 1000, 10000000000);

        StockFacetV2(address(diamond)).issueStock(params);

        // Check that an NFT was minted for the stakeholder
        uint256 tokenId = activePositionNFT.getTokenByStakeholder(stakeholderId);
        assert(tokenId != 0);

        // Get position details directly from the public positions mapping
        (bytes16 posStockClassId, uint256 posQuantity, uint256 posSharePrice, ) = activePositionNFT.positions(tokenId);

        // Verify the position details
        assertEq(posQuantity, 1000);
        assertEq(posSharePrice, 10000000000);
        assertEq(posStockClassId, stockClassId);
    }
}
