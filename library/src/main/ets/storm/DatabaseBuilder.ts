import { DatabaseDao } from '../database/DatabaseDao'
import { Table } from '../schema/Table'
import { relationalStore } from '@kit.ArkData'
import { Context } from '@kit.AbilityKit'
import { Database } from '../schema/Database'
import { Constructor } from '../common/Types'
import { DatabaseMigration } from '../schema/DatabaseMigration'
import { Check } from '../common/Check'
import { SqlUtils } from '../common/SqlUtils'
import { Dao, TableSqliteMaster, TableSqliteSequence } from '../../../../Index'
import { Queue } from '@kit.ArkTS'

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
  private readonly migrations: Queue<DatabaseMigration> = new Queue()

  constructor(private readonly databaseConstructor: Constructor<T>) {
  }

  addMigration(migration: DatabaseMigration): this {
    if (migration) {
      const first = this.migrations.getFirst()
      if (migration.endVersion - migration.startVersion !== 1) {
        throw new Error('The version number does not follow the rules.')
      }
      if ((first && first.endVersion !== migration.startVersion)) {
        throw new Error('The order of the added DatabaseMigration is wrong.')
      }
      this.migrations.add(migration)
    } else {
      throw new Error('The added DatabaseMigration is invalid.')
    }
    return this
  }

  /**
   * 构建数据库
   * @returns {GenerateDaoTypes<T>}
   */
  build() {
    const database = new this.databaseConstructor()
    const migrations = this.migrations
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
      if (migrations.length > 0) {
        instance.beginTransaction(() => {
          while (migrations.length > 0) {
            migrations.pop().migrate({ rdbStore: rdbStore })
          }
        })
      }
      const sqliteMasterDao = new DatabaseDao(rdbStore, TableSqliteMaster)
      const hasTableNames = sqliteMasterDao.toList(it => {
        it.equalTo(TableSqliteMaster.type, 'table')
          .notEqualTo(TableSqliteMaster.name, TableSqliteSequence.tableName)
        return it
      }, TableSqliteMaster.name)
        .map(item => item.name)
      const tablesToCreate = Object.entries(database).reduce((acc, [key, value]) => {
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

          if (!hasTableNames.includes(value.tableName)) {
            acc.push(value)
          }
        } else if (value instanceof Dao && value.table instanceof Table) {
          Check.checkTableAndColumns(value.table)
          value.dao = new DatabaseDao(rdbStore, value.table)
          instance[key] = Object.freeze(value)
          if (!hasTableNames.includes(value.table.tableName)) {
            acc.push(value.table)
          }
        }
        return acc
      }, [])
      if (tablesToCreate.length !== 0) {
        instance.beginTransaction(() => {
          for (const table of tablesToCreate) {
            const createTableSql = SqlUtils.getCreateTableSql(table)
            instance.rdbStore.executeSync(createTableSql)
            const createIndexSql = SqlUtils.getCreateIndexSql(table)
            if (createIndexSql.length !== 0) {
              instance.rdbStore.executeSync(createIndexSql)
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