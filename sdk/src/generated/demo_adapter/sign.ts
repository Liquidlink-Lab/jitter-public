/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = 'jitter/demo-adapter::sign';
export const DEMO = new MoveStruct({ name: `${$moduleName}::DEMO`, fields: {
        dummy_field: bcs.bool()
    } });