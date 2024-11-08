import { ITable, Table } from '../schema/Table';
import 'reflect-metadata';
import { ErrorUtils } from '../utils/ErrorUtils';

const SqlTableMetadataKey = Symbol('SqlTable')

export function SqlTable<M>(value: Table<M>): ClassDecorator {
  return (target) => {
    const table = value as ITable
    if (table._objectConstructor) {
      ErrorUtils.TableNotUnique()
    }
    Reflect.defineMetadata(SqlTableMetadataKey, value,
      table._objectConstructor = target as unknown as ObjectConstructor);
  }
}

export function getSqlTable(target): Table<any> | undefined {
  return Reflect.getMetadata(SqlTableMetadataKey, target)
}