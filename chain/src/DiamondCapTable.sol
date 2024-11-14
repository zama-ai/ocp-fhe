// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "diamond-3-hardhat/contracts/libraries/LibDiamond.sol";
import { IDiamondCut } from "diamond-3-hardhat/contracts/interfaces/IDiamondCut.sol";
import { Diamond } from "diamond-3-hardhat/contracts/Diamond.sol";

contract DiamondCapTable is Diamond {
    constructor(address _contractOwner, address _diamondCutFacet) Diamond(_contractOwner, _diamondCutFacet) {
        // Initialize any additional CapTable specific state here if needed
    }
}
