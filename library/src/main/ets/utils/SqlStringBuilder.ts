import { Column, Table } from '../schema/Table'
import { StringBuilder } from './StringBuilder'

export class SqlUtils {
  private constructor() {
  }

  static getTableCreateSql<A>(table: Table<A>) {
    const sqlBuilder = new StringBuilder()
    const tableArgsBuilder = new StringBuilder()
    for (const key of Object.keys(table)) {
      const value = table[key]
      if (value instanceof Column) {
        tableArgsBuilder.append(`${value._fieldName} ${value._dataType} ${value._isNotNull ? 'NOT NULL' :
          ''} ${value._isUnique ? 'UNIQUE' : ''} ${value._isPrimaryKey ? 'PRIMARY KEY' : ''} ${value._isAutoincrement ?
          'AUTOINCREMENT' : ''},`)
      }
    }
    sqlBuilder.insert(0,
      `CREATE TABLE IF NOT EXISTS ${table.tableName}(${tableArgsBuilder.toString().replace(/,$/, '')})\n`)
    return sqlBuilder.toString().replace(/ +/g, ' ')
  }
}