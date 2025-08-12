// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IAccessControlFacet } from "./IAccessControlFacet.sol";
import { ICapTableFactory } from "./ICaptableFactory.sol";
import { ICapTableInitializer } from "./ICapTableInitializer.sol";
import { IConvertiblesFacet } from "./IConvertiblesFacet.sol";
import { IEquityCompensationFacet } from "./IEquityCompensationFacet.sol";
import { IIssuerFacet } from "./IIssuerFacet.sol";
import { IStakeholderFacet } from "./IStakeholderFacet.sol";
import { IStakeholderNFTFacet } from "./IStakeholderNFTFacet.sol";
import { IStockClassFacet } from "./IStockClassFacet.sol";
import { IStockFacet } from "./IStockFacet.sol";
import { IStockPlanFacet } from "./IStockPlanFacet.sol";
import { IWarrantFacet } from "./IWarrantFacet.sol";
import "./IPrivateStockFacet.sol";

/* Consolidation of interfaces facet internally */
interface ICapTable is
    IAccessControlFacet,
    IConvertiblesFacet,
    IEquityCompensationFacet,
    IIssuerFacet,
    IStakeholderFacet,
    IStakeholderNFTFacet,
    IStockClassFacet,
    IStockFacet,
    IPrivateStockFacet,
    IStockPlanFacet,
    IWarrantFacet
{ }
