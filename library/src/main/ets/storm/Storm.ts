import { Table } from '../schema/Table';
import { Database } from '../schema/Database';
import { TableBuilder } from './TableBuilder';
import { Constructor } from '../common/Types';
import { DatabaseBuilder } from './DatabaseBuilder';

export namespace Storm {

  /**
   * 返回指定数据库的构建器
   * @param databaseConstructor 需要构建的数据库的构造函数
   * @returns {DatabaseBuilder}
   */
  export function databaseBuilder<T extends Database>(databaseConstructor: Constructor<T>) {
    return new DatabaseBuilder(databaseConstructor)
  }

  /**
   * 返回指定表的构建器
   * @param tableConstructor 需要构建的表的构造函数
   * @returns {TableBuilder}
   */
  export function tableBuilder<T extends Table<any>>(tableConstructor: Constructor<T>) {
    return new TableBuilder(tableConstructor)
  }

}