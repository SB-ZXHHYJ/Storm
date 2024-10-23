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
        if (!value.fieldName || !value.dataType) {
          throw new Error('table var in this.value() not use string(..) or number(..)..');
        }
        if (value.fieldName === undefined || value.dataType === undefined) {
          throw new Error('table var in this.value() not use string(..) or number(..)..')
        }
        tableArgsBuilder.append(`${value.fieldName} ${value.dataType} ${value.isNotNull ? 'NOT NULL' :
          ''} ${value.isUnique ? 'UNIQUE' : ''} ${value.isPrimaryKey ? 'PRIMARY KEY' : ''} ${value.isAutoincrement ?
          'AUTOINCREMENT' : ''},`)
      }
    }
    sqlBuilder.insert(0,
      `CREATE TABLE IF NOT EXISTS ${table.tableName}(${tableArgsBuilder.toString().replace(/,$/, '')})\n`)
    return sqlBuilder.toString().replace(/ +/g, ' ')
  }
}