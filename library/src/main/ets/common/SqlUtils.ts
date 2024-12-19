import { Table, UseTableOptions } from '../schema/Table';

export namespace SqlUtils {

  export function getCreateTableSql(targetTable: Table<any>) {
    const tableArgs = targetTable[UseTableOptions]()
      .columns
      .map(column => {
        let definition = `${column.fieldName} ${column.dataType}`
        if (column.isNotNull) {
          definition += ' NOT NULL'
        }
        if (column.isUnique) {
          definition += ' UNIQUE'
        }
        if (column.isPrimaryKey) {
          definition += ' PRIMARY KEY'
        }
        if (column.isAutoincrement) {
          definition += ' AUTOINCREMENT'
        }
        if (column.defaultStr) {
          definition += ` DEFAULT '${column.defaultStr}'`
        }
        return definition
      })
      .join(', ')
    return `CREATE TABLE IF NOT EXISTS ${targetTable.tableName} (${tableArgs})`
  }

  export function getCreateIndexSql(targetTable: Table<any>) {
    return targetTable[UseTableOptions]().indexColumns.map(column => {
      const unique = column.isUnique ? 'UNIQUE' : ''
      const order = column.sortOrder ? column.sortOrder : ''
      const columns = column.columns.map(it => it.fieldName).join(',')
      return `CREATE ${unique} INDEX IF NOT EXISTS ${column.fieldName} ON ${targetTable.tableName} (${columns} ${order});`
    }).join()
  }
}