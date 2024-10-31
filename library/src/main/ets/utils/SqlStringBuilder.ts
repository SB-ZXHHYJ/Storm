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
        if (!value._fieldName || !value._dataType) {
          throw new Error('table var in this.value() not use string(..) or number(..)..');
        }
        if (value._fieldName === undefined || value._dataType === undefined) {
          throw new Error('table var in this.value() not use string(..) or number(..)..')
        }
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