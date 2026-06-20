/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../../../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = 'jitter_math::fixed_point64_with_sign';
export const FixedPoint64WithSign = new MoveStruct({ name: `${$moduleName}::FixedPoint64WithSign`, fields: {
        value: bcs.u128(),
        positive: bcs.bool()
    } });