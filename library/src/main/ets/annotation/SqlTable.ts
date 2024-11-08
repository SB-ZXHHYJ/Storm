import { ITable, Table } from '../schema/Table';
import 'reflect-metadata';
import { ErrorUtils } from '../utils/ErrorUtils';

const SqlTableMetadataKey = Symbol('SqlTable')

/**
 * 将实体绑定到指定的Table上
 * @param value 指定的Table
 */
export function SqlTable<M>(value: Table<M>): ClassDecorator {
  return (target) => {
    const table = value as ITable
    if (table._objectConstructor) {
      ErrorUtils.AtSqlTableNotUnique()
    }
    Reflect.defineMetadata(SqlTableMetadataKey, value,
      table._objectConstructor = target as unknown as ObjectConstructor);
  }
}

export function getSqlTable(target): Table<any> | undefined {
  return Reflect.getMetadata(SqlTableMetadataKey, target)
}