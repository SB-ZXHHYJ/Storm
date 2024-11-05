import { Context } from '@ohos.arkui.UIContext'
import { relationalStore, ValueType } from '@kit.ArkData'
import { Table } from '../schema/Table'
import { SqlUtils } from '../utils/SqlStringBuilder'
import 'reflect-metadata'
import { RdbPredicatesWrapper } from '../utils/RdbPredicatesWrapper'
import { ResultSetUtils } from '../utils/ResultSetUtils'
import { SqliteSequence, sqliteSequences } from '../model/SqliteSequence'

export class Database {
  private readonly rdbStore: relationalStore.RdbStore

  private constructor(rdbStore: relationalStore.RdbStore) {
    this.rdbStore = rdbStore
  }

  /**
   * 关闭数据库
   * @returns 返回一个Promise，异步关闭数据库
   */
  async close(): Promise<void> {
    return this.rdbStore.close()
  }

  /**
   * 对指定表进行增删改查操作
   * @param table 要操作的表
   * @returns 返回这个表的操作对象
   */
  of<T>(table: Table<T>): DatabaseSequenceQueues<T> {
    return new DatabaseSequenceQueues<T>(this.rdbStore, table)
  }

  /**
   * 创建数据库实例
   * @param context 上下文
   * @param config 数据库的配置
   * @returns 返回一个Promise，异步创建数据库实例
   */
  static create(context: Context, config: relationalStore.StoreConfig): Promise<Database> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbStore = await relationalStore.getRdbStore(context, config)
        resolve(new Database(dbStore))
      } catch (e) {
        reject(e)
      }
    })
  }
}

interface IDatabaseSequenceQueues<T> {
  /**
   * 转换上下文到指定的表操作对象
   * @param targetTable 要转换操作的表
   * @returns 返回这个表的操作对象
   */
  to<T>(targetTable: Table<T>): IDatabaseSequenceQueues<T>

  /**
   * 在链式调用中执行额外的代码块
   * @param scope 要执行的lambda表达式
   * @returns this，以支持链式调用
   */
  run(scope: () => void): this

  /**
   * 开启一个作用域
   * @param scope 作用域内的lambda表达式
   * @returns this，以支持链式调用
   */
  begin<E extends DatabaseSequenceQueues<T>>(scope: (it: E) => void): this

  /**
   * 开启一个事务作用域
   * @param scope 事务作用域内的lambda表达式
   * @returns this，以支持链式调用
   */
  beginTransaction<E extends DatabaseSequenceQueues<T>>(scope: (it: E) => void): this

  /**
   * 插入一条数据到数据库
   * @param model 要插入的数据模型
   * @returns this，以支持链式调用
   */
  add(model: T): this

  /**
   * 插入一组数据到数据库
   * @param models 要插入的数据模型数组
   * @returns this，以支持链式调用
   */
  adds(models: T[]): this

  /**
   * 更新一条数据在数据库中的信息
   * @param model 要更新的数据模型
   * @returns this，以支持链式调用
   */
  update(model: T): this

  /**
   * 更新一组数据在数据库中的信息
   * @param models 要更新的数据模型数组
   * @returns this，以支持链式调用
   */
  updates(models: T[]): this

  /**
   * 删除一条数据从数据库
   * @param model 要删除的数据模型
   * @returns this，以支持链式调用
   */
  remove(model: T): this

  /**
   * 删除一组数据从数据库
   * @param models 要删除的数据模型数组
   * @returns this，以支持链式调用
   */
  removes(models: T[]): this

  /**
   * 清空整个表的数据
   * @returns this，以支持链式调用
   */
  clear(): this

  /**
   * 根据条件查询表中的数据
   * @todo 值得注意的是，如果使用事务，在事务没有执行完毕时，你查询到的数据并不是最新的
   * @param wrapperFunction 在这个lambda中返回查询的条件
   * @returns 查询到的数据集合
   */
  query(wrapperFunction: (wrapper: RdbPredicatesWrapper<T>, targetTable: Table<T>) => RdbPredicatesWrapper<T>): T[]
}

export class DatabaseSequenceQueues<T> implements IDatabaseSequenceQueues<T> {
  private readonly rdbStore: relationalStore.RdbStore
  private readonly targetTable: Table<T>

  constructor(rdbStore: relationalStore.RdbStore, targetTable: Table<T>) {
    this.rdbStore = rdbStore
    this.targetTable = targetTable
  }

  to<T>(targetTable: Table<T>): DatabaseSequenceQueues<T> {
    return new DatabaseSequenceQueues<T>(this.rdbStore, targetTable)
  }

  run(scope: () => void): this {
    scope()
    return this
  }

  begin<E extends DatabaseSequenceQueues<T>>(scope: (it: E) => void): this {
    scope.call(undefined, this)
    return this
  }

  beginTransaction<E extends DatabaseSequenceQueues<T>>(scope: (it: E) => void): this {
    try {
      this.rdbStore.beginTransaction()
      scope.call(undefined, this)
      this.rdbStore.commit()
    } catch (e) {
      this.rdbStore.rollBack()
      throw e
    }
    return this
  }

  add(model: T): this {
    return this.adds([model])
  }


  adds(models: T[]): this {
    if (models.length == 0) {
      return this
    }
    // 查询SqlSequence，用于记录自增信息
    const sqlSequenceQuery =
      ResultSetUtils.queryToEntity(this.rdbStore, new RdbPredicatesWrapper(sqliteSequences), sqliteSequences)

    const valueBuckets = models.map((item => {
      return this.targetTable.modelMapValueBucket(item)
    }))

    // 创建目标表（如果不存在）
    this.rdbStore.executeSync(SqlUtils.getTableCreateSql(this.targetTable))

    if (this.targetTable.idColumnLazy.value) {
      // 更新每个值桶中的主键字段
      valueBuckets.forEach((valueBucket) => {
        if (valueBucket[this.targetTable.idColumnLazy.value._fieldName] == null) {
          // 获取表对应的最新自增id
          const sqlSequence = sqlSequenceQuery.find((value) => value.name === this.targetTable.tableName)
          if (sqlSequence) {
            valueBucket[this.targetTable.idColumnLazy.value._fieldName] = sqlSequence.seq += 1
          } else {
            // 如果没有找到序列，则创建一个新的序列
            const newSqlSequence: SqliteSequence = { name: this.targetTable.tableName, seq: 1 }
            sqlSequenceQuery.push(newSqlSequence)
            valueBucket[this.targetTable.idColumnLazy.value._fieldName] = newSqlSequence.seq
          }
        }
      })
    }

    // 批量插入数据到目标表
    valueBuckets
      .forEach(item => {
        return this.rdbStore.insertSync(this.targetTable.tableName, item) != -1
      })

    // 把注解更新到原始模型对象中
    models.forEach((model, i) => {
      Object.entries(valueBuckets[i]).forEach(([key, value]) => {
        model[key] = value
      })
    })

    return this
  }

  update(model: T): this {
    return this.updates([model])
  }

  updates(models: T[]): this {
    if (models.length == 0) {
      return this
    }
    const valueBuckets = models.map((item => {
      return this.targetTable.modelMapValueBucket(item)
    }))
    valueBuckets
      .forEach(item => {
        const wrapper =
          new RdbPredicatesWrapper(this.targetTable).equalTo(this.targetTable.idColumnLazy.value,
            item[this.targetTable.idColumnLazy.value._fieldName] as ValueType)
        this.rdbStore.updateSync(item, wrapper.rdbPredicates)
      })
    return this
  }

  remove(model: T): this {
    this.removes([model])
    return this
  }

  removes(models: T[]): this {
    if (models.length == 0) {
      return this
    }
    const valueBuckets = models.map((item => {
      return this.targetTable.modelMapValueBucket(item)
    }))
    valueBuckets
      .forEach(item => {
        const wrapper =
          new RdbPredicatesWrapper(this.targetTable).equalTo(this.targetTable.idColumnLazy.value,
            item[this.targetTable.idColumnLazy.value._fieldName] as ValueType)
        this.rdbStore.deleteSync(wrapper.rdbPredicates)
      })
    return this
  }

  clear(): this {
    try {
      this.rdbStore.deleteSync(new RdbPredicatesWrapper(this.targetTable).rdbPredicates)
    } finally {
      return this
    }
  }

  query(wrapperFunction: (wrapper: RdbPredicatesWrapper<T>,
    targetTable: Table<T>) => RdbPredicatesWrapper<T> = (wrapper) => {
    return wrapper
  }): T[] {
    const wrapper = wrapperFunction(new RdbPredicatesWrapper(this.targetTable), this.targetTable)
    return ResultSetUtils.queryToEntity(this.rdbStore, wrapper, this.targetTable)
  }
}

export namespace database {
  export declare let globalDatabase: Database

  export async function close() {
    return globalDatabase!!.close().finally(() => {
      globalDatabase = null
    })
  }

  export function of<T>(targetTable: Table<T>) {
    return globalDatabase!!.of(targetTable)
  }
}