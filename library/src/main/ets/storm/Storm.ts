import { Table } from '../schema/Table';
import { Database } from '../schema/Database';
import { TableBuilder } from './TableBuilder';
import { Constructor } from '../common/Types';
import { DatabaseBuilder } from './DatabaseBuilder';
import { Dao } from '../schema/Dao';
import { DaoBuilder } from './DaoBuilder';

export namespace Storm {

  /**
   * 返回指定数据库的构建器
   *
   * @param databaseConstructor 需要构建的 Database 的构造函数
   * @returns 返回一个 DatabaseBuilder 实例，用于构建数据库对象
   */
  export function databaseBuilder<T extends Database>(databaseConstructor: Constructor<T>) {
    return new DatabaseBuilder(databaseConstructor)
  }

  /**
   * 返回指定表的构建器
   *
   * @param tableConstructor 需要构建的 Table 的构造函数
   * @returns 返回一个 TableBuilder 实例，用于构建表对象
   */
  export function tableBuilder<T extends Table<any>>(tableConstructor: Constructor<T>) {
    return new TableBuilder(tableConstructor)
  }

  /**
   * 返回指定数据访问对象（DAO）的构建器
   *
   * @param daoConstructor 需要构建的 DAO 的构造函数
   * @returns 返回一个 DaoBuilder 实例，用于构建 DAO 对象
   */
  export function daoBuilder<T extends Dao<any>>(daoConstructor: Constructor<T>) {
    return new DaoBuilder(daoConstructor)
  }
}