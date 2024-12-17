import { ColumnTypes } from '../schema/Column';
import { Table, UseColumns } from '../schema/Table';
import { Database } from './Database';

export class Operate<T extends Table<any>> {
  constructor(private readonly targetTable: T, private readonly database: Database) {
  }

  addColumn(column: ColumnTypes): this {
    this.database.rdbStore.executeSync(`ALTER TABLE ${this.targetTable.tableName} ADD COLUMN ${column.columnModifier}`)
    return this
  }

  updateColumn(column: ColumnTypes): this {
    this.database.rdbStore.executeSync(`ALTER TABLE ${this.targetTable.tableName} ALTER COLUMN ${column.columnModifier}`)
    return this
  }

  recreate(...oldToNewColumns: [ColumnTypes, ColumnTypes][]): this {
    const useColumns = this.targetTable[UseColumns]()
    const backupTableName = `${this.targetTable.tableName}_backup`
    this.database.rdbStore.executeSync(`CREATE TABLE ${backupTableName}(${useColumns.columns.map(item => item.columnModifier)// 创建备份表，结构与目标表相同
      .join(',')})`)
    const columns = Array.from(oldToNewColumns).map(([oldCol, newCol]) => {
      return { oldColumn: oldCol, targetColumn: newCol }
    })
    const oldColumns = columns.map(item => item.oldColumn.fieldName)
    const targetColumns = columns.map(item => item.targetColumn.fieldName)
    this.database.rdbStore.executeSync(`INSERT INTO ${backupTableName}(${targetColumns.join(',')}) SELECT ${oldColumns.join(',')} FROM ${this.targetTable.tableName}`)
    this.database.rdbStore.executeSync(`DROP TABLE ${this.targetTable.tableName}`)
    this.database.rdbStore.executeSync(`ALTER TABLE ${backupTableName} RENAME TO ${this.targetTable.tableName}`)
    return this
  }

  executeSync(sql: string) {
    this.database.rdbStore.executeSync(sql)
  }
}

export abstract class Migration<T extends Table<any>> {
  /**
   * 当前版本号，必须为整数，且不可小于 1
   */
  abstract readonly currentVersion: number

  /**
   * 目标版本号，必须为整数，且不可小于等于 1
   */
  abstract readonly targetVersion: number

  abstract migrate(operate: Operate<T>): void
}