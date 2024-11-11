import { Column, Table } from '../../../../Index';
import { ValueType } from '@kit.ArkData';

export class Check {
  private constructor() {
  }

  /**
   * 检查Table是否存在主键
   * @param targetTable 目标Table
   */
  static checkTableHasIdColumn(targetTable: Table<any>) {
    if (targetTable._tableIdColumns.length === 0) {
      throw new Error(`Table "${targetTable.tableName}" does not have a primary key.`)
    }
  }

  /**
   * 检查Table是否是多主键
   * @param targetTable 目标Table
   */
  static checkTableHasAtMostOneIdColumn(targetTable: Table<any>) {
    this.checkTableHasIdColumn(targetTable)
    if (targetTable._tableIdColumns.length > 1) {
      throw new Error(`Table "${targetTable.tableName}" has more than one primary key. Only one primary key is supported.`)
    }
  }

  /**
   * 检查column是否重复绑定属性
   * @param column 要检查的column
   */
  static checkColumnUniqueBindTo(column: Column<ValueType, any>) {
    if (column._key) {
      throw new Error(`Each property can only be decorated with one @SqlColumn().`)
    }
  }
}