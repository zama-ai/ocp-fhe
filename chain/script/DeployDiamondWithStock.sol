// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Diamond } from "../lib/diamond-3-hardhat/contracts/Diamond.sol";
import { DiamondCutFacet } from "../lib/diamond-3-hardhat/contracts/facets/DiamondCutFacet.sol";
import { StockFacet } from "../src/facets/StockFacet.sol";
import { IDiamondCut } from "../lib/diamond-3-hardhat/contracts/interfaces/IDiamondCut.sol";

contract DiamondDeployer {
    function deployDiamond() public returns (address) {
        // Deploy facets
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        StockFacet stockFacet = new StockFacet();

        // Create FacetCut array
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](2);

        // DiamondCutFacet
        bytes4[] memory diamondCutSelectors = new bytes4[](1);
        diamondCutSelectors[0] = DiamondCutFacet.diamondCut.selector;
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondCutFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: diamondCutSelectors
        });

        // StockFacet with both issueStock and initializeIssuer
        bytes4[] memory stockSelectors = new bytes4[](4);
        stockSelectors[0] = StockFacet.issueStock.selector;
        stockSelectors[1] = StockFacet.initializeIssuer.selector;
        stockSelectors[2] = StockFacet.createStockClass.selector;
        stockSelectors[3] = StockFacet.createStakeholder.selector;
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(stockFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: stockSelectors
        });

        // Deploy Diamond with just the cut facet address
        Diamond diamond = new Diamond(msg.sender, address(diamondCutFacet));

        // Perform the cuts after deployment
        IDiamondCut(address(diamond)).diamondCut(cuts, address(0), "");

        return address(diamond);
    }
}
