import { ICommon, Table } from '../schema/Table';
import 'reflect-metadata';

const SqlTableMetadataKey = Symbol('SqlTable')

export function SqlTable<A>(table: Table<A>): ClassDecorator {
  return (target) => {
    const common = (table as ICommon)
    if (common._entityPrototype != null) {
      throw TypeError('不可以对一个表重复使用@SqlTable()注解')
    }
    Reflect.defineMetadata(SqlTableMetadataKey, table,
      common._entityPrototype = target as unknown as ObjectConstructor);
  }
}

export function getSqlTable(target): Table<any> | undefined {
  return Reflect.getMetadata(SqlTableMetadataKey, target)
}