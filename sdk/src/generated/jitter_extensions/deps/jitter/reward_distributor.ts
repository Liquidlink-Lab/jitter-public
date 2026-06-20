/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * reward_distributor - no-stake reward coordination layer.
 * 
 * This module does not custody user principal. It only coordinates rewarder
 * settlement around position or pool mutations. Rewarder implementations live in
 * separate modules and must mark their own rewarder ID as settled before the
 * hot-potato operation can be destroyed.
 */

import { MoveStruct } from '../../../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = 'jitter::reward_distributor';
export const RewarderSettlementCap = new MoveStruct({ name: `${$moduleName}::RewarderSettlementCap`, fields: {
        distributor_id: bcs.Address,
        scope: bcs.u8(),
        rewarder_id: bcs.Address
    } });