import { Column } from '../schema/Table';
import 'reflect-metadata';
import { ValueType } from '@kit.ArkData';
import { ErrorUtils } from '../utils/ErrorUtils';

const ColumnMetadataKey = Symbol('SqlColumn')

export function SqlColumn<T>(value: Column<ValueType, T>): PropertyDecorator {
  return (target: ObjectConstructor, primaryKey: string) => {
    if (value._entityBindFunction) {
      ErrorUtils.SqlColumnNotUnique()
    }
    value._entityBindFunction = (entity, value) => {
      entity[primaryKey] = value
    }
    Reflect.defineMetadata(ColumnMetadataKey, value, target, primaryKey)
  }
}

export function getSqlColumn(target: ObjectConstructor, primaryKey: string): Column<ValueType, any> | undefined {
  return Reflect.getMetadata(ColumnMetadataKey, target.prototype, primaryKey)
}