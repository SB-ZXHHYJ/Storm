import { ColumnTypes, IndexColumn } from '../schema/Column';
import { Table, UseTableOptions } from '../schema/Table';

/**
 * 用于辅助创建 sql 语句
 */
export class SupportSqliteCmds {
  private commands = ''

  private constructor(private readonly targetTable: Table<any>) {
  }

  private buildColumnModifier(column: ColumnTypes) {
    let modifier = `${column.fieldName} ${column.dataType}`
    if (column.isNotNull) {
      modifier += ' NOT NULL'
    }
    if (column.isUnique) {
      modifier += ' UNIQUE'
    }
    if (column.isPrimaryKey) {
      modifier += ' PRIMARY KEY'
    }
    if (column.isAutoincrement) {
      modifier += ' AUTOINCREMENT'
    }
    if (column.defaultStr) {
      modifier += ` DEFAULT '${column.defaultStr}'`
    }
    return modifier
  }

  createTable(ifNotExists: boolean = true, columns?: ColumnTypes[]) {
    const columnArgs = (columns ?? this.targetTable[UseTableOptions]().columns)
      .map(column => this.buildColumnModifier(column))
      .join(', ')
    this.commands += `CREATE TABLE ${ifNotExists ? 'IF NOT EXISTS' : ''} ${this.targetTable.tableName} (${columnArgs});`
    return this
  }

  createIndex(ifNotExists: boolean = true, indexColumns?: IndexColumn[]) {
    this.commands += (indexColumns ?? this.targetTable[UseTableOptions]().indexColumns)
      .map(column => {
        const columnArgs = column
          .columns
          .map(([column, order]) => `${column.fieldName}${order ? ` ${order}` : ''}`)
          .join(',')
        return `CREATE ${column.isUnique ? 'UNIQUE' : ''} INDEX ${ifNotExists ? 'IF NOT EXISTS' :
          ''} ${column.fieldName} ON ${this.targetTable.tableName}(${columnArgs});`
      }).join()
    return this
  }

  alterTable() {
    this.commands += `ALTER TABLE ${this.targetTable.tableName} `
    return this
  }

  addColumn(column: ColumnTypes) {
    this.commands += `ADD COLUMN ${column.fieldName} ${this.buildColumnModifier(column)};`
    return this
  }

  alterColumn(column: ColumnTypes) {
    this.commands += `ALTER COLUMN ${column.fieldName} ${this.buildColumnModifier(column)};`
    return this
  }

  build() {
    try {
      return this.commands
    } finally {
      delete this.commands
    }
  }

  get [Symbol.toStringTag]() {
    return this.commands
  }

  static select(targetTable: Table<any>) {
    return new SupportSqliteCmds(targetTable)
  }
}