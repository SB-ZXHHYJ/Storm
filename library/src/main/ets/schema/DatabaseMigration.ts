import { RdbStoreHelper } from '../common/RdbStoreHelper';
import { SupportSqliteCmds } from '../common/SupportSqliteCmds';
import { Table, UseTableOptions } from './Table';

export abstract class DatabaseMigration {
  /**
   * 数据库的起始版本号
   * 当此版本号与数据库的当前版本号相等时，将触发迁移操作
   */
  abstract readonly startVersion: number

  /**
   * 目标版本号
   * 当 startVersion 为 0 时，endVersion 将被忽略，转而去使用 setVersion 设置的值
   */
  abstract readonly endVersion: number

  /**
   * 子类需要重写此方法以定义具体的迁移步骤
   * 如果成功迁移，数据库的版本号将被设置为 endVersion 的值
   *
   * @param targetTable 要迁移的目标表实例
   * @param rdbStore 用于辅助访问数据库
   */
  abstract migrate(tables: Table<any>[], helper: RdbStoreHelper): void

  static create(startVersion: number, endVersion: number): DatabaseMigration {
    return {
      startVersion: startVersion,
      endVersion: endVersion,
      migrate: function (tables: Table<any>[], rdbStore: RdbStoreHelper) {
        for (const table of tables) {
          const options = table[UseTableOptions]()
          const migration =
            options.migrations.find(item => (item.startVersion === startVersion && item.endVersion === endVersion))
          migration?.migrate(table, rdbStore)
        }
      }
    }
  }
}

/**
 * 用于自动初始化数据库
 */
export const AutoMigration = new class AutoMigration extends DatabaseMigration {
  readonly startVersion: number = 0
  readonly endVersion: number = NaN

  migrate(tables: Table<any>[], rdbStore: RdbStoreHelper): void {
    for (const table of tables) {
      rdbStore.executeSync(SupportSqliteCmds.select(table).createTable(false))
      rdbStore.executeSync(SupportSqliteCmds.select(table).createIndex(false))
    }
  }
}