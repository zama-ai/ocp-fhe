// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@diamond/facets/ConvertiblesFacet.sol";
import "@diamond/DiamondCapTable.sol";
import "diamond-3-hardhat/facets/DiamondCutFacet.sol";
import "diamond-3-hardhat/interfaces/IDiamondCut.sol";
import "../../src/lib/Structs.sol";
import "@diamond/Storage.sol";

contract DiamondConvertibleIssuanceTest is Test {
    uint256 public issuerInitialSharesAuthorized = 1000000;
    bytes16 public issuerId = 0xd3373e0a4dd9430f8a563281f2800e1e;
    address public contractOwner;

    DiamondCutFacet public dcf;
    ConvertiblesFacet public cf;
    DiamondCapTable public diamond;

    event StakeholderCreated(bytes16 indexed id);
    event TxCreated(uint256 index, TxType txType, bytes txData);

    function setUp() public {
        // Set contract owner
        contractOwner = address(this);

        // Deploy facets
        dcf = new DiamondCutFacet();
        cf = new ConvertiblesFacet();

        // Deploy Diamond with cut facet
        diamond = new DiamondCapTable(contractOwner, address(dcf));

        // Create FacetCut array - only for ConvertiblesFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);

        // ConvertiblesFacet
        bytes4[] memory convertibleSelectors = new bytes4[](2);
        convertibleSelectors[0] = ConvertiblesFacet.issueConvertible.selector;
        convertibleSelectors[1] = ConvertiblesFacet.getPosition.selector;

        cut[0] = IDiamondCut.FacetCut({ facetAddress: address(cf), action: IDiamondCut.FacetCutAction.Add, functionSelectors: convertibleSelectors });

        // Perform the cuts
        DiamondCutFacet(address(diamond)).diamondCut(cut, address(0), "");

        // Initialize the issuer
        DiamondCapTable(payable(address(diamond))).initializeIssuer(issuerId, issuerInitialSharesAuthorized);
    }

    function createStakeholder() public returns (bytes16) {
        bytes16 stakeholderId = 0xd3373e0a4dd940000000000000000005;

        vm.expectEmit(true, false, false, false, address(diamond));
        emit StakeholderCreated(stakeholderId);
        DiamondCapTable(payable(address(diamond))).createStakeholder(stakeholderId, "INDIVIDUAL", "INVESTOR");

        return stakeholderId;
    }

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
