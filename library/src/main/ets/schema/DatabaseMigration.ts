import { MigrationHelper } from '../common/MigrationHelper';
import { Dao } from './Dao';
import { Database } from './Database';
import { Table } from './Table';

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
   * 重写以实现迁移逻辑
   */
  abstract migrate(table: ExtractTableTypes<T>[keyof ExtractTableTypes<T>], helper: MigrationHelper): void
}