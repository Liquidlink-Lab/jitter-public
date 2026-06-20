/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as table from './deps/sui/table.js';
import * as table_1 from './deps/sui/table.js';
import * as table_2 from './deps/sui/table.js';
const $moduleName = 'jitter/jitter-admin::acl';
export const ACL = new MoveStruct({ name: `${$moduleName}::ACL`, fields: {
        id: bcs.Address,
        roles: table.Table,
        roles_id_table: table_1.Table,
        operation_role: table_2.Table
    } });
export const RoleGrantedEvent = new MoveStruct({ name: `${$moduleName}::RoleGrantedEvent`, fields: {
        account: bcs.Address,
        role: bcs.u8()
    } });
export const RoleRevokedEvent = new MoveStruct({ name: `${$moduleName}::RoleRevokedEvent`, fields: {
        account: bcs.Address,
        role: bcs.u8()
    } });
export const RoleCreatedEvent = new MoveStruct({ name: `${$moduleName}::RoleCreatedEvent`, fields: {
        role_id: bcs.u8(),
        role_name: bcs.string()
    } });
export const RoleAssignedToOperationEvent = new MoveStruct({ name: `${$moduleName}::RoleAssignedToOperationEvent`, fields: {
        operation: bcs.string(),
        role_id: bcs.u8()
    } });
export const RoleDeletedEvent = new MoveStruct({ name: `${$moduleName}::RoleDeletedEvent`, fields: {
        role_id: bcs.u8()
    } });
export const RoleUnassignedFromOperationEvent = new MoveStruct({ name: `${$moduleName}::RoleUnassignedFromOperationEvent`, fields: {
        operation: bcs.string()
    } });
export interface GrantRoleArguments {
    acl: RawTransactionArgument<string>;
    Admin: RawTransactionArgument<string>;
    account: RawTransactionArgument<string>;
    role: RawTransactionArgument<number>;
}
export interface GrantRoleOptions {
    package?: string;
    arguments: GrantRoleArguments | [
        acl: RawTransactionArgument<string>,
        Admin: RawTransactionArgument<string>,
        account: RawTransactionArgument<string>,
        role: RawTransactionArgument<number>
    ];
}
/** Grant Role to an address */
export function grantRole(options: GrantRoleOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-admin';
    const argumentsTypes = [
        null,
        null,
        'address',
        'u8'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "Admin", "account", "role"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'acl',
        function: 'grant_role',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RevokeRoleArguments {
    acl: RawTransactionArgument<string>;
    Admin: RawTransactionArgument<string>;
    account: RawTransactionArgument<string>;
    role: RawTransactionArgument<number>;
}
export interface RevokeRoleOptions {
    package?: string;
    arguments: RevokeRoleArguments | [
        acl: RawTransactionArgument<string>,
        Admin: RawTransactionArgument<string>,
        account: RawTransactionArgument<string>,
        role: RawTransactionArgument<number>
    ];
}
/** Revoke Role from an address */
export function revokeRole(options: RevokeRoleOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-admin';
    const argumentsTypes = [
        null,
        null,
        'address',
        'u8'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "Admin", "account", "role"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'acl',
        function: 'revoke_role',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CreateRoleArguments {
    acl: RawTransactionArgument<string>;
    Admin: RawTransactionArgument<string>;
    roleId: RawTransactionArgument<number>;
    roleName: RawTransactionArgument<string>;
}
export interface CreateRoleOptions {
    package?: string;
    arguments: CreateRoleArguments | [
        acl: RawTransactionArgument<string>,
        Admin: RawTransactionArgument<string>,
        roleId: RawTransactionArgument<number>,
        roleName: RawTransactionArgument<string>
    ];
}
export function createRole(options: CreateRoleOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-admin';
    const argumentsTypes = [
        null,
        null,
        'u8',
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "Admin", "roleId", "roleName"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'acl',
        function: 'create_role',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssignRoleToOperationArguments {
    acl: RawTransactionArgument<string>;
    Admin: RawTransactionArgument<string>;
    operation: RawTransactionArgument<string>;
    roleId: RawTransactionArgument<number>;
}
export interface AssignRoleToOperationOptions {
    package?: string;
    arguments: AssignRoleToOperationArguments | [
        acl: RawTransactionArgument<string>,
        Admin: RawTransactionArgument<string>,
        operation: RawTransactionArgument<string>,
        roleId: RawTransactionArgument<number>
    ];
}
export function assignRoleToOperation(options: AssignRoleToOperationOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-admin';
    const argumentsTypes = [
        null,
        null,
        '0x1::string::String',
        'u8'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "Admin", "operation", "roleId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'acl',
        function: 'assign_role_to_operation',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DeleteRoleArguments {
    acl: RawTransactionArgument<string>;
    Admin: RawTransactionArgument<string>;
    roleId: RawTransactionArgument<number>;
}
export interface DeleteRoleOptions {
    package?: string;
    arguments: DeleteRoleArguments | [
        acl: RawTransactionArgument<string>,
        Admin: RawTransactionArgument<string>,
        roleId: RawTransactionArgument<number>
    ];
}
export function deleteRole(options: DeleteRoleOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-admin';
    const argumentsTypes = [
        null,
        null,
        'u8'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "Admin", "roleId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'acl',
        function: 'delete_role',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnassignRoleFromOperationArguments {
    acl: RawTransactionArgument<string>;
    Admin: RawTransactionArgument<string>;
    operation: RawTransactionArgument<string>;
}
export interface UnassignRoleFromOperationOptions {
    package?: string;
    arguments: UnassignRoleFromOperationArguments | [
        acl: RawTransactionArgument<string>,
        Admin: RawTransactionArgument<string>,
        operation: RawTransactionArgument<string>
    ];
}
export function unassignRoleFromOperation(options: UnassignRoleFromOperationOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-admin';
    const argumentsTypes = [
        null,
        null,
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "Admin", "operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'acl',
        function: 'unassign_role_from_operation',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface HasRoleArguments {
    self: RawTransactionArgument<string>;
    account: RawTransactionArgument<string>;
    operation: RawTransactionArgument<string>;
}
export interface HasRoleOptions {
    package?: string;
    arguments: HasRoleArguments | [
        self: RawTransactionArgument<string>,
        account: RawTransactionArgument<string>,
        operation: RawTransactionArgument<string>
    ];
}
export function hasRole(options: HasRoleOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-admin';
    const argumentsTypes = [
        null,
        'address',
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["self", "account", "operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'acl',
        function: 'has_role',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertHasRoleArguments {
    self: RawTransactionArgument<string>;
    account: RawTransactionArgument<string>;
    operation: RawTransactionArgument<string>;
}
export interface AssertHasRoleOptions {
    package?: string;
    arguments: AssertHasRoleArguments | [
        self: RawTransactionArgument<string>,
        account: RawTransactionArgument<string>,
        operation: RawTransactionArgument<string>
    ];
}
/** Assert that an address has a specific role, otherwise abort */
export function assertHasRole(options: AssertHasRoleOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-admin';
    const argumentsTypes = [
        null,
        'address',
        '0x1::string::String'
    ] satisfies (string | null)[];
    const parameterNames = ["self", "account", "operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'acl',
        function: 'assert_has_role',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}