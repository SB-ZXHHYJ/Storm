import { DatabaseDao } from '../database/DatabaseDao'
import { Table } from '../schema/Table'
import { relationalStore } from '@kit.ArkData'
import { Context } from '@kit.AbilityKit'
import { Database } from '../schema/Database'
import { Constructor } from '../common/Types'
import { DatabaseMigration } from '../database/migration/DatabaseMigration'
import { Check } from '../common/Check'
import { SqlUtils } from '../common/SqlUtils'
import { TableSqliteMaster, TableSqliteSequence } from '../../../../Index'

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

/**
 * Database 的构建器
 */
export class DatabaseBuilder<T extends Database> {
  private readonly migrations: DatabaseMigration<T>[] = []

  constructor(private readonly databaseConstructor: Constructor<T>) {
  }

  addMigration(migration: DatabaseMigration<T>): this {
    if (migration) {
      this.migrations.push(migration)
    } else {
      throw new Error('The added DatabaseMigration is invalid.')
    }
    return this
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
      const sqliteMasterDao = new DatabaseDao(rdbStore, TableSqliteMaster)
      const sqliteSequence = new DatabaseDao(rdbStore, TableSqliteSequence)
      const hasTableNames = sqliteMasterDao.toList(it => {
        it.equalTo(TableSqliteMaster.type, 'table')
          .notEqualTo(TableSqliteMaster.name, TableSqliteSequence.tableName)
        return it
      }, TableSqliteMaster.name)
        .map(item => item.name)
      for (const element of Object.entries(database)) {
        const [key, value] = element
        if (value instanceof Table) {
          if (Object.is(value, TableSqliteMaster)) {
            instance[key] = sqliteMasterDao
            continue
          }
          if (Object.is(value, TableSqliteSequence)) {
            instance[key] = sqliteSequence
            continue
          }
          Check.checkTableAndColumns(value)
          instance[key] = new DatabaseDao(rdbStore, value)
          if (hasTableNames.indexOf(value.tableName) === -1) {
            instance.beginTransaction(() => {
              const createTableSql = SqlUtils.getCreateTableSql(value)
              rdbStore.executeSync(createTableSql)
              const createIndexSql = SqlUtils.getCreateIndexSql(value)
              if (createIndexSql.length !== 0) {
                rdbStore.executeSync(createIndexSql)
              }
            })
          }
        }
      }
      instance.init = null
      Object.freeze(instance)
    }
    return instance
  }
}