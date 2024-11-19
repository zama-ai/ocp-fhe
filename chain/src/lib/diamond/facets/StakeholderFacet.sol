// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StorageLib, Storage } from "../Storage.sol";
import { Stakeholder } from "../../Structs.sol";

contract StakeholderFacet {
    event StakeholderCreated(bytes16 indexed id);
    error StakeholderAlreadyExists(bytes16 stakeholder_id);

    function createStakeholder(bytes16 _id, string memory _stakeholder_type, string memory _current_relationship) external {
        Storage storage ds = StorageLib.get();

        if (ds.stakeholderIndex[_id] > 0) {
            revert StakeholderAlreadyExists(_id);
        }

        ds.stakeholders.push(Stakeholder(_id, _stakeholder_type, _current_relationship));
        ds.stakeholderIndex[_id] = ds.stakeholders.length;

        emit StakeholderCreated(_id);
    }
}
