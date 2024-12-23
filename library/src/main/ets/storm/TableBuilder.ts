import { Constructor } from '../common/Types'
import { TableMigration } from '../schema/TableMigration'
import { Table, UseTableOptions } from '../schema/Table'

export class TableBuilder<T extends Table<any>> {
  private readonly tableMigrations: TableMigration<T>[] = []

  constructor(private readonly tableConstructor: Constructor<T>) {
  }

  /**
   * 添加迁移到迁移列表
   *
   * @param migration 要添加的表迁移对象
   * @returns this
   */
  addMigrations(...migrations: TableMigration<T>[]): this {
    if (migrations.length > 0) {
      for (const element of migrations) {
        this.tableMigrations.push(element)
      }
    }
    return this
  }

  /**
   * 构建表实例
   *
   * @returns 返回构建好的表实例
   */
  build(): T {
    const instance = new this.tableConstructor()
    if (this.tableMigrations.length > 0) {
      const useOptions = instance[UseTableOptions]()
      for (const element of this.tableMigrations) {
        useOptions.addMigration(element)
      }
    }
    return instance
  }
}