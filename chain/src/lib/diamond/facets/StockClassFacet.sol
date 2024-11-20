// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StorageLib, Storage } from "../Storage.sol";
import { StockClass } from "../Structs.sol";

contract StockClassFacet {
    event StockClassCreated(bytes16 indexed id, string indexed classType, uint256 indexed pricePerShare, uint256 initialSharesAuthorized);

    error StockClassAlreadyExists(bytes16 stock_class_id);

    function createStockClass(bytes16 _id, string memory _class_type, uint256 _price_per_share, uint256 _initial_share_authorized) external {
        Storage storage ds = StorageLib.get();

        if (ds.stockClassIndex[_id] > 0) {
            revert StockClassAlreadyExists(_id);
        }

        ds.stockClasses.push(
            StockClass({
                id: _id,
                class_type: _class_type,
                price_per_share: _price_per_share,
                shares_issued: 0,
                shares_authorized: _initial_share_authorized
            })
        );

        ds.stockClassIndex[_id] = ds.stockClasses.length;

        emit StockClassCreated(_id, _class_type, _price_per_share, _initial_share_authorized);
    }
}
