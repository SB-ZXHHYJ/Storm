import { SafeColumns } from '../schema/Column';
import { Table } from '../schema/Table';
import { Database } from './Database';

export class Operate<T extends Table<any>> {
  constructor(private readonly targetTable: T, private readonly database: Database) {
  }

  addColumn(column: SafeColumns<T>): this {
    this.database.rdbStore.executeSync(`ALTER TABLE ${this.targetTable.tableName} ADD COLUMN ${column._columnModifier}`)
    return this
  }

  updateColumn(column: SafeColumns<T>): this {
    this.database.rdbStore.executeSync(`ALTER TABLE ${this.targetTable.tableName} ALTER COLUMN ${column._columnModifier}`)
    return this
  }

  recreate(oldInNewMap: Map<SafeColumns<T>, SafeColumns<T>>): this {
    const backupTableName = `${this.targetTable.tableName}_backup`
    this.database.rdbStore.executeSync(`CREATE TABLE ${backupTableName}(${this.targetTable.tableColumns.map(item => item._columnModifier)// 创建备份表，结构与目标表相同
      .join(',')})`)
    const columns = Array.from(oldInNewMap).map(([oldCol, newCol]) => {
      return { oldColumn: oldCol, targetColumn: newCol }
    })
    const oldColumns = columns.map(item => item.oldColumn._fieldName)
    const targetColumns = columns.map(item => item.targetColumn._fieldName)
    this.database.rdbStore.executeSync(`INSERT INTO ${backupTableName}(${targetColumns.join(',')}) SELECT ${oldColumns.join(',')} FROM ${this.targetTable.tableName}`)
    this.database.rdbStore.executeSync(`DROP TABLE ${this.targetTable.tableName}`)
    this.database.rdbStore.executeSync(`ALTER TABLE ${backupTableName} RENAME TO ${this.targetTable.tableName}`)
    return this
  }
}

export abstract class Migration<T extends Table<any>> {
  /**
   * 默认版本号
   */
  public static DEFAULT_TABLE_VERSION = 1

  /**
   * 版本号，必须为整数，且不可小于1
   */
  abstract readonly tableVersion: number

  abstract onVersionUp(targetVersion: number, operate: Operate<T>): void
}