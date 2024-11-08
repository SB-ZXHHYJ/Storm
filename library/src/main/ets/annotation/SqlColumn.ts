import { Column, IColumn } from '../schema/Column';
import 'reflect-metadata';
import { ValueType } from '@kit.ArkData';
import { ErrorUtils } from '../utils/ErrorUtils';

const ColumnMetadataKey = Symbol('SqlColumn')

export function SqlColumn<V>(value: Column<ValueType, V>): PropertyDecorator {
  return (target: object, primaryKey: string) => {
    const column = value as IColumn<ValueType>
    if (column._key) {
      ErrorUtils.AtSqlColumnNotUnique()
    }
    column._key = primaryKey
    Reflect.defineMetadata(ColumnMetadataKey, value, target, primaryKey)
  }
}

export function getSqlColumn(target: ObjectConstructor, primaryKey: string): Column<ValueType, ValueType> | undefined {
  return Reflect.getMetadata(ColumnMetadataKey, target.prototype, primaryKey)
}