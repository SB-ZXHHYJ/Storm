import { Constructor } from '../common/Types'
import { TableMigration } from '../schema/TableMigration'
import { Table, UseTableOptions } from '../schema/Table'

/**
 * 表的构建器
 */
export class TableBuilder<T extends Table<any>> {
  private readonly migrations: TableMigration<T>[] = []

  private openOrCreate = false

  constructor(private readonly tableConstructor: Constructor<T>) {
  }

  createFormAuto() {
    this.openOrCreate = true
    return this
  }

  /**
   * 为这个表添加迁移操作
   * @param migration 需要添加的迁移操作对象
   * @returns {this}
   */
  addMigration(migration: TableMigration<T>): this {
    if (migration) {
      this.migrations.push(migration)
    } else {
      throw new Error('The added TableMigration is invalid.')
    }
    return this
  }

  /**
   * 构建表
   * @returns {T}
   */
  build(): T {
    const instance = new this.tableConstructor()
    if (this.migrations.length > 0) {
      const useOptions = instance[UseTableOptions]()
      for (const element of this.migrations) {
        useOptions.addMigration(element)
      }
    }
    return instance
  }
}