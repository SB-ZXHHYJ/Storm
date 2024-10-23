import { ICommon, Table } from '../schema/Table';
import 'reflect-metadata';

const SqlTableMetadataKey = Symbol('SqlTable')

export function SqlTable<A>(table: Table<A>): ClassDecorator {
  return (target) => {
    const common = (table as ICommon)
    if (common.entityPrototype != null) {
      throw TypeError('Table is repeatedly bound by multiple entities')
    }
    Reflect.defineMetadata(SqlTableMetadataKey, table, common.entityPrototype = target);
  }
}

export function getSqlTable(target): Table<any> | undefined {
  return Reflect.getMetadata(SqlTableMetadataKey, target)
}

