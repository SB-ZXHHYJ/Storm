import { Context } from '@ohos.arkui.UIContext'
import { relationalStore, ValueType } from '@kit.ArkData'
import { Table } from '../schema/Table'
import { SqlUtils } from '../utils/SqlStringBuilder'
import 'reflect-metadata'
import { RdbPredicatesWrapper } from '../utils/RdbPredicatesWrapper'
import { ResultSetUtils } from '../utils/ResultSetUtils'
import { SqliteSequence, sqliteSequences } from '../model/SqliteSequence'

export class Database {
  private rdbStore: relationalStore.RdbStore

  private constructor(rdbStore: relationalStore.RdbStore) {
    this.rdbStore = rdbStore
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    return this.rdbStore.close()
  }

  /**
   * 对表进行增删改查的操作
   * @param targetTable 要操作的表
   * @returns 返回这个表的操作对象
   */
  of<T>(table: Table<T>): DatabaseSequenceQueues<T> {
    return new DatabaseSequenceQueues<T>(this.rdbStore, table)
  }

  /**
   * 创建数据库
   * @param context 上下文
   * @param config 数据库的配置
   * @returns 异步创建数据库
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

export class DatabaseSequenceQueues<T> {
  private readonly rdbStore: relationalStore.RdbStore
  private readonly targetTable: Table<T>

  constructor(rdbStore: relationalStore.RdbStore, targetTable: Table<T>) {
    this.rdbStore = rdbStore
    this.targetTable = targetTable
  }

  /**
   * 转换上下文
   * @param targetTable 要转换操作的表
   * @returns 返回这个表的操作对象
   */
  to<T>(table: Table<T>): DatabaseSequenceQueues<T> {
    return new DatabaseSequenceQueues<T>(this.rdbStore, table)
  }

  /**
   * 用于链式调用中想执行其他代码时使用
   * @param scope 要执行的lambda
   * @returns this
   */
  run(scope: () => void): DatabaseSequenceQueues<T> {
    scope()
    return this
  }

  /**
   * 开启一个没什么用的空间
   * @param scope 没什么用的空间
   * @returns this
   */
  begin<E extends DatabaseSequenceQueues<T>>(scope: (it: E) => void): DatabaseSequenceQueues<T> {
    scope.call(undefined, this)
    return this
  }

  /**
   * 开启一个事务
   * @param scope 事务空间
   * @returns this
   */
  beginTransaction<E extends DatabaseSequenceQueues<T>>(scope: (it: E) => void): DatabaseSequenceQueues<T> {
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

  /**
   * 插入一条数据
   * @param model 要插入的数据
   * @returns this
   */
  add(model: T): DatabaseSequenceQueues<T> {
    return this.adds([model])
  }

  /**
   * 插入一组数据
   * @param models 要插入的数据
   * @returns this
   */
  adds(models: T[]): DatabaseSequenceQueues<T> {
    this.insertCount(models)
    return this
  }

  /**
   * 更新一条数据
   * @param model 要更新的数据
   * @returns this
   */
  update(model: T): DatabaseSequenceQueues<T> {
    return this.updates([model])
  }

  /**
   * 更新一组数据
   * @param models 要更新的数据
   * @returns this
   */
  updates(models: T[]): DatabaseSequenceQueues<T> {
    this.updateCount(models)
    return this
  }

  /**
   * 删除一条数据
   * @param model 要删除的数据
   * @returns this
   */
  remove(model: T): DatabaseSequenceQueues<T> {
    this.removes([model])
    return this
  }

  /**
   * 删除一组数据
   * @param models 要删除的数据
   * @returns this
   */
  removes(models: T[]): DatabaseSequenceQueues<T> {
    this.removeCount(models)
    return this
  }

  /**
   * 清空表
   * @returns this
   */
  clear(): DatabaseSequenceQueues<T> {
    this.clearCount
    return this
  }

  /**
   * 从表中插入数据
   * @param models 要插入的数据
   * @returns 插入的数据行数
   */
  insertCount(models: T[]): number {
    if (models.length == 0) {
      return 0
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
    const insertedCount = valueBuckets
      .map(item => {
        return this.rdbStore.insertSync(this.targetTable.tableName, item) != -1
      })
      .filter((item) => {
        return item
      })
      .length

    // 更新原始模型对象以包含新插入的ID
    models.forEach((model, i) => {
      Object.entries(valueBuckets[i]).forEach(([key, value]) => {
        model[key] = value
      })
    })

    return insertedCount // 返回插入操作成功的数量
  }

  /**
   * 从表中更新数据
   * @param models 要更新的数据
   * @returns 更新的数据行数
   */
  updateCount(models: T[]): number {
    if (models.length == 0) {
      return 0
    }
    const valueBuckets = models.map((item => {
      return this.targetTable.modelMapValueBucket(item)
    }))
    const updatedCount = valueBuckets
      .map(item => {
        const wrapper =
          new RdbPredicatesWrapper(this.targetTable).equalTo(this.targetTable.idColumnLazy.value,
            item[this.targetTable.idColumnLazy.value._fieldName] as ValueType)
        return this.rdbStore.updateSync(item, wrapper.rdbPredicates) !=
          -1
      })
      .filter((item) => {
        return item
      })
      .length
    return updatedCount
  }

  /**
   * 从表中移除数据
   * @param models 要移除的数据
   * @returns 删除的数据行数
   */
  removeCount(models: T[]): number {
    if (models.length == 0) {
      return 0
    }
    const valueBuckets = models.map((item => {
      return this.targetTable.modelMapValueBucket(item)
    }))
    const updatedCount = valueBuckets
      .map(item => {
        const wrapper =
          new RdbPredicatesWrapper(this.targetTable).equalTo(this.targetTable.idColumnLazy.value,
            item[this.targetTable.idColumnLazy.value._fieldName] as ValueType)
        return this.rdbStore.deleteSync(wrapper.rdbPredicates) != -1
      })
      .filter((item) => {
        return item
      })
      .length
    return updatedCount
  }

  /**
   * 根据条件删除表中的数据
   * @param wrapperFunction
   * @returns
   */
  removeIf(wrapperFunction: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T>): number {
    const wrapper = wrapperFunction(new RdbPredicatesWrapper(this.targetTable))
    return this.rdbStore.deleteSync(wrapper.rdbPredicates)
  }

  /**
   * 清空表
   * @returns 返回受影响的数据行数
   */
  clearCount(): number {
    try {
      return this.removeIf((it) => {
        return it
      })
    } catch (e) {
      return 0
    }
  }

  /**
   * 根据条件查询表中的数据
   * @param wrapperFunction 查询条件表达式
   * @returns 查询到的数据集合
   */
  query(wrapperFunction: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T> = (wrapper) => {
    return wrapper
  }): T[] {
    const wrapper = wrapperFunction(new RdbPredicatesWrapper(this.targetTable))
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