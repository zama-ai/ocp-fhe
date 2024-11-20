// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StorageLib, Storage } from "../Storage.sol";
import { StockPlan } from "../Structs.sol";

contract StockPlanFacet {
    event StockPlanCreated(bytes16 indexed id, uint256 shares_reserved);
    error StockPlanAlreadyExists(bytes16 stock_plan_id);
    error InvalidStockClass(bytes16 stock_class_id);

    function createStockPlan(bytes16 _id, bytes16[] memory _stock_class_ids, uint256 _shares_reserved) external {
        Storage storage ds = StorageLib.get();

        if (ds.stockPlanIndex[_id] > 0) {
            revert StockPlanAlreadyExists(_id);
        }

        // Verify all stock classes exist
        for (uint256 i = 0; i < _stock_class_ids.length; i++) {
            if (ds.stockClassIndex[_stock_class_ids[i]] == 0) {
                revert InvalidStockClass(_stock_class_ids[i]);
            }
        }

        // Create and push stock plan to array
        ds.stockPlans.push(StockPlan({ stock_class_ids: _stock_class_ids, shares_reserved: _shares_reserved }));

        // Update index mapping (1-based indexing)
        ds.stockPlanIndex[_id] = ds.stockPlans.length;

        emit StockPlanCreated(_id, _shares_reserved);
    }
}
