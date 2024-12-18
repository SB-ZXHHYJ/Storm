import { DatabaseDao } from './database/DatabaseDao';
import { Migration } from './database/Migration';
import { Table, UseMigrations } from './schema/Table';
import { Context } from '@kit.AbilityKit';
import { Database } from './schema/Database';
import { relationalStore } from '@kit.ArkData';

type Constructor<T> = new (...args: any[]) => T

type GenerateDaoTypes<T extends Record<string, any>> = {
  [K in keyof T as T[K] extends Table<any> ? K : never]: DatabaseDao<T[K]>
} & {
  /**
   * 数据库的 RdbStore 对象，在初始化数据库后可调用，但建议尽可能不要直接使用 RdbStore
   */
  rdbStore: relationalStore.RdbStore,
  /**
   * 初始化数据库，请务必在使用前初始化，否则将导致异常
   * @param context 上下文
   * @returns {Promise<void>}
   */
  init: (context: Context) => Promise<void>,
  /**
   * 开启一个事务的 lambda 空间
   * @param scope lambda
   * @returns {Promise<void>}
   */
  beginTransaction: (scope: ((it: GenerateDaoTypes<T>) => void)) => void,
  /**
   * 开启一个异步的 lambda 空间
   * @param scope lambda
   * @returns {Promise<void>}
   */
  beginAsync: (scope: ((it: GenerateDaoTypes<T>) => void)) => Promise<void>,
}

export namespace Storm {

  /**
   * 返回指定数据库的构建器
   * @param databaseConstructor 需要构建的数据库的构造函数
   * @returns {DatabaseBuilder}
   */
  export function databaseBuilder<T extends Database>(databaseConstructor: Constructor<T>) {
    return new DatabaseBuilder(databaseConstructor)
  }

  /**
   * 返回指定表的构建器
   * @param tableConstructor 需要构建的表的构造函数
   * @returns {TableBuilder}
   */
  export function tableBuilder<T extends Table<any>>(tableConstructor: Constructor<T>) {
    return new TableBuilder(tableConstructor)
  }

}

/**
 * 数据库的构建器
 */
class DatabaseBuilder<T extends Database> {
  constructor(private readonly databaseConstructor: Constructor<T>) {
  }

  /**
   * 构建数据库
   * @returns {GenerateDaoTypes<T>}
   */
  build(): GenerateDaoTypes<T> {
    const database = new this.databaseConstructor()
    const instance = {} as GenerateDaoTypes<T>
    instance.init = async function (context: Context) {
      const rdbStore = await database.initDb(context)
      instance.rdbStore = rdbStore
      instance.beginTransaction = function (scope) {
        try {
          rdbStore.beginTransaction()
          scope(instance)
          rdbStore.commit()
        } catch (e) {
          rdbStore.rollBack()
          throw e
        }
      }
      instance.beginAsync = function (scope) {
        return new Promise((resolve) => {
          resolve(scope(instance))
        })
      }
      for (const element of Object.entries(database)) {
        const [key, value] = element
        if (value instanceof Table) {
          instance[key] = new DatabaseDao(rdbStore, value)
        }
      }
      instance.init = null
      Object.freeze(instance)
    }
    return instance
  }
}

/**
 * 表的构建器
 */
class TableBuilder<T extends Table<any>> {
  private migrations: Migration<T>[] = null

  constructor(private readonly tableConstructor: Constructor<T>) {
  }

  /**
   * 为这个表添加迁移操作
   * @param migration 需要添加的迁移操作对象
   * @returns {this}
   */
  addMigration(migration: Migration<T>): this {
    if (!this.migrations) {
      this.migrations = []
    }
    this.migrations.push(migration)
    return this
  }

  /**
   * 构建表
   * @returns {T}
   */
  build(): T {
    const instance = new this.tableConstructor()
    if (this.migrations && this.migrations.length > 0) {
      const useMigrations = instance[UseMigrations]()
      for (const element of this.migrations) {
        useMigrations.addMigration(element)
      }
    }
    return instance
  }
}