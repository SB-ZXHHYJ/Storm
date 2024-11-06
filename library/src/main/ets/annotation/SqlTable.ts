import { ICommon, Table } from '../schema/Table';
import 'reflect-metadata';
import { ErrorUtils } from '../utils/ErrorUtils';

const SqlTableMetadataKey = Symbol('SqlTable')

export function SqlTable<A>(table: Table<A>): ClassDecorator {
  return (target) => {
    const common = (table as ICommon)
    if (common._entityPrototype) {
      ErrorUtils.TableNotUnique()
    }
    Reflect.defineMetadata(SqlTableMetadataKey, table,
      common._entityPrototype = target as unknown as ObjectConstructor);
  }
}

export function getSqlTable(target): Table<any> | undefined {
  return Reflect.getMetadata(SqlTableMetadataKey, target)
}