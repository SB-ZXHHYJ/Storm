import { DatabaseDao } from '../database/DatabaseDao'
import { Table } from '../schema/Table'
import { relationalStore } from '@kit.ArkData'
import { Context } from '@kit.AbilityKit'
import { Database } from '../schema/Database'
import { Constructor } from '../common/Types'
import { DatabaseMigration } from '../schema/DatabaseMigration'
import { Check } from '../common/Check'
import { Dao, MigrationHelper, TableSqliteMaster, TableSqliteSequence } from '../../../../Index'
import { HashSet } from '@kit.ArkTS'

export type GenerateDaoTypes<T extends Record<string, any>> = {
  [K in keyof T as (T[K] extends Table<any> ? K : T[K] extends Dao<any> ? K : never)]: (T[K] extends Table<any> ? DatabaseDao<T[K]> : T[K] extends Dao<any> ? T[K] : never)
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

/**
 * Database 的构建器
 */
export class DatabaseBuilder<T extends Database> {
  private databaseMigrations: DatabaseMigration<T>[]
  private databaseVersion: number

  constructor(private readonly databaseConstructor: Constructor<T>) {
  }

  /**
   * 设置数据库版本号
   * @param version 版本号
   * @returns {this}
   */
  setVersion(version) {
    this.databaseVersion = version
    return this
  }

  /**
   *
   * @param migrations
   * @returns {this}
   */
  addMigrations(...migrations: DatabaseMigration<T>[]): this {
    if (migrations.length > 0) {
      if (!this.databaseMigrations) {
        this.databaseMigrations = []
      }
      for (const element of migrations) {
        this.databaseMigrations.push(element)
      }
    }
    return this
  }

  /**
   * 构建数据库
   * @returns {GenerateDaoTypes<T>}
   */
  build() {
    const database = new this.databaseConstructor()
    const databaseVersion = this.databaseVersion
    const pendingMigrations = this.databaseMigrations
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
      const sqliteMasterDao = new DatabaseDao(rdbStore, TableSqliteMaster)
      const databaseTables = Object.entries(database).reduce((acc, [key, value]) => {
        if (value instanceof Table) {
          if (Object.is(value, TableSqliteMaster)) {
            instance[key] = sqliteMasterDao
            return acc
          }
          if (Object.is(value, TableSqliteSequence)) {
            instance[key] = new DatabaseDao(rdbStore, TableSqliteSequence)
            return acc
          }
          Check.checkTableAndColumns(value)
          instance[key] = Object.freeze(new DatabaseDao(rdbStore, value))
          acc.add(value)
        } else if (value instanceof Dao && value.table instanceof Table) {
          Check.checkTableAndColumns(value.table)
          value.dao = new DatabaseDao(rdbStore, value.table)
          instance[key] = Object.freeze(value)
          acc.add(value.table)
        }
        return acc
      }, new HashSet<Table<any>>())

      if (pendingMigrations.length > 0) {
        if (!databaseVersion) {
          throw new Error('Database does not set version.')
        }
        const firstMigration = pendingMigrations[0]
        if (firstMigration.startVersion !== 0) {
          throw new Error('The first migration start version should be 0.')
        }
        for (let i = 1; i < pendingMigrations.length; i++) {
          const migration = pendingMigrations[i]
          if (migration.endVersion - migration.startVersion !== 1) {
            throw new Error('The version number does not follow the rules.')
          }
          if (i === pendingMigrations.length && migration.endVersion !== databaseVersion) {
            throw new Error('The database migration path is not correct.')
          }
        }
        instance.beginTransaction(() => {
          const hasTableNames = sqliteMasterDao.toList(it => {
            it.equalTo(TableSqliteMaster.type, 'table')
              .notEqualTo(TableSqliteMaster.name, TableSqliteSequence.tableName)
            return it
          }, TableSqliteMaster.name)
            .map(item => item.name)
          const tablesToCreate = Array.from(databaseTables).filter(item =>!hasTableNames.includes(item.tableName))
          const helper = new MigrationHelper(rdbStore)
          if (rdbStore.version === 0) {
            const migration_0_x = pendingMigrations.pop()
            migration_0_x.migrate(tablesToCreate as any, helper)
            rdbStore.version = databaseVersion
          } else {
            for (const migration of pendingMigrations) {
              if (rdbStore.version === migration.startVersion) {
                migration.migrate(tablesToCreate as any, helper)
                rdbStore.version = migration.endVersion
              }
            }
          }
        })
      }
      instance.init = null
      Object.freeze(instance)
    }
    return instance
  }
}