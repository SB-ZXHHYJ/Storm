import { Table } from '../../../../Index';
import { IColumn } from '../schema/Column';

export class Check {
  private constructor() {
  }

  /**
   * 检查Table是否存在主键
   * @param targetTable 目标Table
   */
  static checkTableHasIdColumn(targetTable: Table<any>) {
    if (targetTable._idColumnLazy.value === undefined) {
      throw new Error(`Table "${targetTable.tableName}" does not have a primary key.`)
    }
  }

  /**
   * 检查column是否重复绑定属性
   * @param column 要检查的column
   */
  static checkColumnUniqueBindTo(column: IColumn<any>) {
    if (column._key) {
      throw new Error(`Each property can only be decorated with one @SqlColumn().`)
    }
  }
}