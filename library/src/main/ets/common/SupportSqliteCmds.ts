import { ColumnTypes, IndexColumn } from '../schema/Column';
import { Table, UseTableOptions } from '../schema/Table';

export class SupportSqliteCmds implements Object {
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

  /**
   * 创建表的 SQL 命令
   *
   * @param ifNotExists 是否在表已存在时不执行创建，默认为 true
   * @param columns 要创建的列的数组，默认为目标表的列
   * @returns this
   */
  createTable(ifNotExists: boolean = true,
    columns?: ColumnTypes[]): Omit<SupportSqliteCmds, 'addColumn' | 'alterTable'> {
    const columnArgs = (columns ?? this.targetTable[UseTableOptions]().columns)
      .map(column => this.buildColumnModifier(column))
      .join(', ')
    this.commands += `CREATE TABLE ${ifNotExists ? 'IF NOT EXISTS' : ''} ${this.targetTable.tableName} (${columnArgs});`
    return this
  }

  /**
   * 创建索引的 SQL 命令
   *
   * @param ifNotExists 是否在索引已存在时不执行创建，默认为 true
   * @param indexColumns 要创建的索引列的数组，默认为目标表的索引列
   * @returns this
   */
  createIndex(ifNotExists: boolean = true,
    indexColumns?: IndexColumn[]): Omit<SupportSqliteCmds, 'addColumn' | 'alterTable'> {
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


  /**
   * 开始构建 ALTER TABLE 语句
   *
   * @returns this 后续必须调用 addColumn 或者 alterTable 来结束
   */
  alterTable(): Pick<SupportSqliteCmds, 'addColumn' | 'alterTable'> {
    this.commands += `ALTER TABLE ${this.targetTable.tableName} `
    return this
  }

  /**
   * 添加列的 SQL 语句
   *
   * @param column 新增的列
   * @returns this
   */
  addColumn(column: ColumnTypes) {
    this.commands += `ADD COLUMN ${column.fieldName} ${this.buildColumnModifier(column)};`
    return this
  }

  /**
   * 更新列的 SQL 语句
   *
   * @param column 要更新的列
   * @returns this
   */
  alterColumn(column: ColumnTypes) {
    this.commands += `ALTER COLUMN ${column.fieldName} ${this.buildColumnModifier(column)};`
    return this
  }

  toString(): string {
    try {
      return this.commands
    } finally {
      delete this.commands
    }
  }

  /**
   * 选择一个表来创建 SupportSqliteCmds 实例
   *
   * @param targetTable 目标表
   * @returns SupportSqliteCmds 实例
   */
  static select(targetTable: Table<any>) {
    return new SupportSqliteCmds(targetTable)
  }
}