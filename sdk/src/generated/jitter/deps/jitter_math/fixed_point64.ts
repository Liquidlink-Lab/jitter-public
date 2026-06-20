/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../../../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = 'jitter_math::fixed_point64';
export const FixedPoint64 = new MoveStruct({ name: `${$moduleName}::FixedPoint64`, fields: {
        value: bcs.u128()
    } });