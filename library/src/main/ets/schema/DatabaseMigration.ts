import { MigrationHelper } from '../common/MigrationHelper';
import { SupportSqliteCmds } from '../common/SupportSqliteCmds';
import { Table, UseTableOptions } from './Table';

export abstract class DatabaseMigration {
  /**
   * 数据库的起始版本号，当这个数值等于数据库的当前版本号时，将会触发 migrate。
   */
  abstract readonly startVersion: number

  /**
   * 目标版本号。
   * 当 startVersion 为 0 时，endVersion 将被忽略，转而去使用 setVersion 设置的值。
   */
  abstract readonly endVersion: number

  /**
   * 重写以实现迁移逻辑，如果成功迁移，数据库的版本号将被设置为 endVersion 的值
   */
  abstract migrate(tables: Table<any>[], helper: MigrationHelper): void

  static create(startVersion: number, endVersion: number): DatabaseMigration {
    return {
      startVersion: startVersion,
      endVersion: endVersion,
      migrate: function (tables: Table<any>[], helper: MigrationHelper) {
        for (const table of tables) {
          const options = table[UseTableOptions]()
          const migration =
            options.migrations.find(item => (item.startVersion === startVersion && item.endVersion === endVersion))
          migration?.migrate(table, helper)
        }
      }
    }
  }
}

export const AutoMigration = new class AutoMigration extends DatabaseMigration {
  readonly startVersion: number = 0
  readonly endVersion: number = NaN

  migrate(tables: Table<any>[], helper: MigrationHelper): void {
    for (const table of tables) {
      helper.executeSync(SupportSqliteCmds.select(table).createTable(false))
      helper.executeSync(SupportSqliteCmds.select(table).createIndex(false))
    }
  }
}