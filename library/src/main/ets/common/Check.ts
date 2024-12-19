import { Table, UseTableOptions } from '../schema/Table';

export namespace Check {

  /**
   * 检查 Table 是否存在主键
   * @param targetTable 要检查的 Table
   */
  export function checkTableHasIdColumn(targetTable: Table<any>) {
    const useOptions = targetTable[UseTableOptions]()
    if (useOptions.idColumns.length === 0) {
      throw new Error(`In "${targetTable.tableName}", there is no primary key.`)
    }
  }

  /**
   * 检查 Table 是否是多主键
   * @param targetTable 要检查的 Table
   */
  export function checkTableHasAtMostOneIdColumn(targetTable: Table<any>) {
    checkTableHasIdColumn(targetTable)
    const useOptions = targetTable[UseTableOptions]()
    if (useOptions.idColumns.length > 1) {
      throw new Error(`In "${targetTable.tableName}", there is more than one primary key. Only one primary key is allowed.`)
    }
  }

  /**
   * 检查 Table 是否符合规范
   * @param targetTable 要检查的 Table
   */
  export function checkTableAndColumns(targetTable: Table<any>) {
    const useOptions = targetTable[UseTableOptions]()
    const keys = useOptions.columns.map(it => it.key)
    if (new Set(keys).size !== keys.length) {
      throw new Error(`In ${targetTable.tableName}, different columns are bound to the same entity property.`)
    }
    const fieldNames =
      useOptions.columns.map(it => it.fieldName).concat(useOptions.indexColumns.map(it => it.fieldName))
    if (new Set(fieldNames).size !== fieldNames.length) {
      throw new Error(`In ${targetTable.tableName}, there is a problem with duplicate column names.`)
    }
  }

}