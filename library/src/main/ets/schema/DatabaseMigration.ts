import { relationalStore } from '@kit.ArkData';


export interface DatabaseMigrationOptions {
  readonly rdbStore: relationalStore.RdbStore
}

export abstract class DatabaseMigration {
  /**
   * 数据库的起始版本号，当这个数值等于数据库的当前版本号时，将会触发 migrate
   */
  abstract readonly startVersion: number

  /**
   * 目标版本号
   */
  abstract readonly endVersion: number

  /**
   * 重写以实现迁移逻辑
   */
  abstract migrate(options: DatabaseMigrationOptions): void
}