import { Table } from './Table';
import { RdbStoreHelper } from '../common/RdbStoreHelper';

export abstract class TableMigration<T extends Table<any>> {
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
   *
   * @param targetTable 要迁移的目标表实例
   * @param rdbStore 用于辅助访问数据库
   */
  abstract migrate(targetTable: T, rdbStore: RdbStoreHelper): void
}