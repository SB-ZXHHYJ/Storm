import { Column, IColumn } from '../schema/Column';
import 'reflect-metadata';
import { ValueType } from '@kit.ArkData';

const ColumnMetadataKey = Symbol('SqlColumn')

export function SqlColumn<V>(value: Column<ValueType, V>): PropertyDecorator {
  return (target: object, primaryKey: string) => {
    const column = value as IColumn<ValueType>
    column._key = primaryKey
    Reflect.defineMetadata(ColumnMetadataKey, value, target, primaryKey)
  }
}

export function getSqlColumn(target: ObjectConstructor, primaryKey: string): Column<ValueType, ValueType> | undefined {
  return Reflect.getMetadata(ColumnMetadataKey, target.prototype, primaryKey)
}