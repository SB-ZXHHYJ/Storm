import { Table } from '../../schema/Table';
import { relationalStore } from '@kit.ArkData';

export interface TableMigrationOptions<T extends Table<any>> {
  readonly table: T
  readonly rdbStore: relationalStore.RdbStore
}

export abstract class TableMigration<T extends Table<any>> {
  /**
   * 表的起始版本号，当这个数值等于表的当前版本号时，将会触发 migrate
   */
  abstract readonly startVersion: number

  /**
   * 目标版本号
   */
  abstract readonly endVersion: number

  /**
   * 重写以实现迁移逻辑
   */
  abstract migrate(options: TableMigrationOptions<T>): void
}