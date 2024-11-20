// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "diamond-3-hardhat/libraries/LibDiamond.sol";
import { StorageLib, Storage } from "../Storage.sol";
import { Issuer } from "../Structs.sol";

contract IssuerFacet {
    error IssuerAlreadyInitialized();

    function initializeIssuer(bytes16 id, uint256 initial_shares_authorized) external {
        LibDiamond.enforceIsContractOwner();
        Storage storage ds = StorageLib.get();

        if (ds.issuer.shares_authorized != 0) {
            revert IssuerAlreadyInitialized();
        }

        ds.issuer = Issuer({ id: id, shares_issued: 0, shares_authorized: initial_shares_authorized });
    }
}
