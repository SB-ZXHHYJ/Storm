import { MigrationHelper } from '../common/MigrationHelper';
import { SupportSqliteCmds } from '../common/SupportSqliteCmds';
import { Dao } from './Dao';
import { Database } from './Database';
import { Table, UseTableOptions } from './Table';

type ExtractTableTypes<T extends Database> = {
  [K in keyof T as (T[K] extends Table<any> ? K : T[K] extends Dao<any> ? K : never)]: (T[K] extends Table<any> ? T[K] : T[K] extends Dao<infer M> ? M : never)
}

export abstract class DatabaseMigration<T extends Database> {
  /**
   * 数据库的起始版本号，当这个数值等于数据库的当前版本号时，将会触发 migrate
   */
  abstract readonly startVersion: number

  /**
   * 目标版本号
   */
  abstract readonly endVersion: number

  /**
   * 重写以实现迁移逻辑，如果成功迁移，数据库的版本号将被设置为 endVersion 的值
   */
  abstract migrate(tables: ExtractTableTypes<T>[keyof ExtractTableTypes<T>][], helper: MigrationHelper): void

  static create<T extends Database>(startVersion: number, endVersion: number): DatabaseMigration<T> {
    return {
      startVersion: startVersion,
      endVersion: endVersion,
      migrate: function (tables: Table<any>[], helper: MigrationHelper) {
        for (const table of tables) {
          const options = table[UseTableOptions]()
          const migration =
            options.migrations.find(item =>
            (item.startVersion === startVersion && item.endVersion === endVersion)
            )
          migration?.migrate(table, helper)
        }
      }
    }
  }
}

export const AutoMigration = new class AutoMigration<T extends Database> extends DatabaseMigration<T> {
  readonly startVersion: number = 0
  readonly endVersion: number = NaN

  migrate(tables: ExtractTableTypes<T>[keyof ExtractTableTypes<T>][], helper: MigrationHelper): void {
    for (const table of tables) {
      helper.executeSync(SupportSqliteCmds.select(table).createTable(false))
      helper.executeSync(SupportSqliteCmds.select(table).createIndex(false))
    }
  }
}