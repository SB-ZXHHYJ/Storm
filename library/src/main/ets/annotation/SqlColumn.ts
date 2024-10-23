import { Column } from '../schema/Table';
import 'reflect-metadata';
import { ValueType } from '@kit.ArkData';

const ColumnMetadataKey = Symbol('SqlColumn')

export function SqlColumn(value: Column<ValueType>): PropertyDecorator {
  return (target, primaryKey) => {
    value.entityBindFunction ??= (entity, value) => {
      entity[primaryKey] = value
    }
    Reflect.defineMetadata(ColumnMetadataKey, value, target, primaryKey);
  }
}

export function getSqlColumn(target, primaryKey): Column<ValueType> | undefined {
  return Reflect.getMetadata(ColumnMetadataKey, target, primaryKey)
}