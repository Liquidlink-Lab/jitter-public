/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../../../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = 'liquidlink_incentive_system::point_cap';
export const PointCap = new MoveStruct({ name: `${$moduleName}::PointCap`, fields: {
        id: bcs.Address,
        project_id: bcs.Address
    } });