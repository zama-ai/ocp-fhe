// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@diamond/DiamondCapTable.sol";
import "@diamond/facets/IssuerFacet.sol";
import { StakeholderFacet } from "@diamond/facets/StakeholderFacet.sol";
import { StockClassFacet } from "@diamond/facets/StockClassFacet.sol";
import { StockFacet } from "@diamond/facets/StockFacet.sol";
import { ConvertiblesFacet } from "@diamond/facets/ConvertiblesFacet.sol";
import { EquityCompensationFacet } from "@diamond/facets/EquityCompensationFacet.sol";
import { StockPlanFacet } from "@diamond/facets/StockPlanFacet.sol";
import "diamond-3-hardhat/facets/DiamondCutFacet.sol";
import "diamond-3-hardhat/interfaces/IDiamondCut.sol";

contract DiamondTestBase is Test {
    uint256 public issuerInitialSharesAuthorized = 1000000;
    bytes16 public issuerId = 0xd3373e0a4dd9430f8a563281f2800e1e;
    address public contractOwner;

    DiamondCutFacet public diamondCutFacet;
    IssuerFacet public issuerFacet;
    StakeholderFacet public stakeholderFacet;
    StockClassFacet public stockClassFacet;
    StockFacet public stockFacet;
    ConvertiblesFacet public convertiblesFacet;
    EquityCompensationFacet public equityCompensationFacet;
    StockPlanFacet public stockPlanFacet;
    DiamondCapTable public diamond;

    event StockIssued(bytes16 indexed stakeholderId, bytes16 indexed stockClassId, uint256 quantity, uint256 sharePrice);
    event StakeholderCreated(bytes16 indexed id);
    event StockClassCreated(bytes16 indexed id, string indexed classType, uint256 indexed pricePerShare, uint256 initialSharesAuthorized);
    event StockPlanCreated(bytes16 indexed id, uint256 shares_reserved);

    function setUp() public virtual {
        contractOwner = address(this);

        // Deploy facets
        diamondCutFacet = new DiamondCutFacet();
        issuerFacet = new IssuerFacet();
        stakeholderFacet = new StakeholderFacet();
        stockClassFacet = new StockClassFacet();
        stockFacet = new StockFacet();
        convertiblesFacet = new ConvertiblesFacet();
        equityCompensationFacet = new EquityCompensationFacet();
        stockPlanFacet = new StockPlanFacet();

        // Deploy Diamond
        diamond = new DiamondCapTable(contractOwner, address(diamondCutFacet));

        // Add facets
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](7);

        bytes4[] memory issuerSelectors = new bytes4[](1);
        issuerSelectors[0] = IssuerFacet.initializeIssuer.selector;

        bytes4[] memory stakeholderSelectors = new bytes4[](1);
        stakeholderSelectors[0] = StakeholderFacet.createStakeholder.selector;

        bytes4[] memory stockClassSelectors = new bytes4[](1);
        stockClassSelectors[0] = StockClassFacet.createStockClass.selector;

        bytes4[] memory stockSelectors = new bytes4[](1);
        stockSelectors[0] = StockFacet.issueStock.selector;

        bytes4[] memory convertibleSelectors = new bytes4[](2);
        convertibleSelectors[0] = ConvertiblesFacet.issueConvertible.selector;
        convertibleSelectors[1] = ConvertiblesFacet.getPosition.selector;

        bytes4[] memory equityCompensationSelectors = new bytes4[](2);
        equityCompensationSelectors[0] = EquityCompensationFacet.issueEquityCompensation.selector;
        equityCompensationSelectors[1] = EquityCompensationFacet.getPosition.selector;

        bytes4[] memory stockPlanSelectors = new bytes4[](1);
        stockPlanSelectors[0] = StockPlanFacet.createStockPlan.selector;

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(issuerFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: issuerSelectors
        });

        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(stakeholderFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: stakeholderSelectors
        });

        cut[2] = IDiamondCut.FacetCut({
            facetAddress: address(stockClassFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: stockClassSelectors
        });

        cut[3] = IDiamondCut.FacetCut({
            facetAddress: address(stockFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: stockSelectors
        });

        cut[4] = IDiamondCut.FacetCut({
            facetAddress: address(convertiblesFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: convertibleSelectors
        });

        cut[5] = IDiamondCut.FacetCut({
            facetAddress: address(equityCompensationFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: equityCompensationSelectors
        });

        cut[6] = IDiamondCut.FacetCut({
            facetAddress: address(stockPlanFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: stockPlanSelectors
        });

        DiamondCutFacet(address(diamond)).diamondCut(cut, address(0), "");

        // Initialize issuer
        IssuerFacet(payable(address(diamond))).initializeIssuer(issuerId, issuerInitialSharesAuthorized);
    }

    // Common helper functions
    function createStakeholder() public returns (bytes16) {
        bytes16 stakeholderId = 0xd3373e0a4dd940000000000000000005;
        vm.expectEmit(true, false, false, false, address(diamond));
        emit StakeholderCreated(stakeholderId);
        StakeholderFacet(payable(address(diamond))).createStakeholder(stakeholderId);
        return stakeholderId;
    }
}
