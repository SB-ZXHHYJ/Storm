import { Column, SupportValueType } from '../schema/Column';
import { Table } from '../schema/Table';

export namespace Check {

  /**
   * 检查Table是否存在主键
   * @param targetTable 目标Table
   */
  export function checkTableHasIdColumn(targetTable: Table<any>) {
    if (targetTable.tableIdColumns.length === 0) {
      throw new Error(`In "${targetTable.tableName}", there is no primary key.`)
    }
  }

  /**
   * 检查Table是否是多主键
   * @param targetTable 目标Table
   */
  export function checkTableHasAtMostOneIdColumn(targetTable: Table<any>) {
    checkTableHasIdColumn(targetTable);
    if (targetTable.tableIdColumns.length > 1) {
      throw new Error(`In "${targetTable.tableName}", there is more than one primary key. Only one primary key is allowed.`)
    }
  }

  /**
   * 检查Table和内部的Column是否符合规范
   * @param targetTable
   */
  export function checkTableAndColumns(targetTable: Table<any>) {
    if (!Number.isInteger(targetTable.tableVersion)) {
      throw new Error(`In ${targetTable.tableName}, the version number must be an integer.`)
    }

    const keys = targetTable.tableAllColumns.map(it => it._key);
    if (new Set(keys).size !== keys.length) {
      throw new Error(`In ${targetTable.tableName}, different columns are bound to the same entity property.`)
    }
  }

  /**
   * 检查column是否重复绑定属性
   * @param column 要检查的column
   */
  export function checkColumnUniqueBindTo(column: Column<SupportValueType, any>) {
    if (column._key) {
      throw new Error(`In ${column._fieldName}, each property can only be decorated with one bindTo().`)
    }
  }
}