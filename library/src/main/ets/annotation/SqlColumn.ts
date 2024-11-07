import { Column, PColumn } from '../schema/Column';
import 'reflect-metadata';
import { ValueType } from '@kit.ArkData';
import { ErrorUtils } from '../utils/ErrorUtils';

const ColumnMetadataKey = Symbol('SqlColumn')

export function SqlColumn<T>(column: Column<ValueType, T>): PropertyDecorator {
  return (target: object, primaryKey: string) => {
    const pColumn = column as PColumn<ValueType>
    if (pColumn._entityBindFunction) {
      ErrorUtils.SqlColumnNotUnique()
    }
    pColumn._key = primaryKey
    Reflect.defineMetadata(ColumnMetadataKey, column, target, primaryKey)
  }
}

export function getSqlColumn(target: ObjectConstructor, primaryKey: string): Column<ValueType, any> | undefined {
  return Reflect.getMetadata(ColumnMetadataKey, target.prototype, primaryKey)
}