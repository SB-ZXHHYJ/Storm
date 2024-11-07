import { PTable, Table } from '../schema/Table';
import 'reflect-metadata';
import { ErrorUtils } from '../utils/ErrorUtils';

const SqlTableMetadataKey = Symbol('SqlTable')

export function SqlTable<A>(table: Table<A>): ClassDecorator {
  return (target) => {
    const targetTable = table as PTable
    if (targetTable._objectConstructor) {
      ErrorUtils.TableNotUnique()
    }
    Reflect.defineMetadata(SqlTableMetadataKey, table,
      targetTable._objectConstructor = target as unknown as ObjectConstructor);
  }
}

export function getSqlTable(target): Table<any> | undefined {
  return Reflect.getMetadata(SqlTableMetadataKey, target)
}