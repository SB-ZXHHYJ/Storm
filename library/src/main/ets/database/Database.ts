import { Context } from '@ohos.arkui.UIContext'
import { relationalStore, ValueType } from '@kit.ArkData'
import { Table } from '../schema/Table'
import 'reflect-metadata'
import { RdbPredicatesWrapper } from '../utils/RdbPredicatesWrapper'
import { SqliteSequence, sqliteSequences } from '../model/SqliteSequence'
import { ErrorUtils } from '../utils/ErrorUtils'
import { Column, ReferencesColumn } from '../schema/Column'
import { StormTableVersion, stormTableVersions } from '../model/StormTableVersion'
import { getSqlColumn } from '../annotation/SqlColumn'

class SessionQueueManager {
  private constructor() {
  }

  private static readonly sessionQueueMap = new Map<Table<any>, DatabaseSession<any>>();

  static getSessionQueue<M>(rdbStore: relationalStore.RdbStore, targetTable: Table<M>): DatabaseSession<M> {
    if (this.sessionQueueMap.has(targetTable)) {
      return this.sessionQueueMap.get(targetTable)
    }

    const newSessionQueue = new DatabaseSession<M>(rdbStore, targetTable)
    this.sessionQueueMap.set(targetTable, newSessionQueue)
    return newSessionQueue
  }

  static clearSessionQueues(): void {
    this.sessionQueueMap.clear()
  }
}

export class Database {
  private constructor(private readonly rdbStore: relationalStore.RdbStore) {
  }

  /**
   * 关闭数据库
   * @returns 返回一个Promise，异步关闭数据库
   */
  async close(): Promise<void> {
    SessionQueueManager.clearSessionQueues()
    return this.rdbStore.close()
  }

  /**
   * 对指定表进行增删改查操作
   * @param targetTable 要操作的表
   * @returns 返回这个表的操作对象
   */
  of<T>(targetTable: Table<T>): DatabaseSession<T> {
    return SessionQueueManager.getSessionQueue(this.rdbStore, targetTable)
  }

  /**
   * 创建数据库实例
   * @param context 上下文
   * @param config 数据库的配置
   * @returns 返回一个Promise，异步创建数据库实例
   */
  static async create(context: Context, config: relationalStore.StoreConfig): Promise<Database> {
    try {
      return new Database(await relationalStore.getRdbStore(context, config))
    } catch (error) {
      throw error
    }
  }
}

type ColumnValuePairs = ReadonlyArray<[Column<ValueType, any>, ValueType | null]>

interface IDatabaseSession<T> {
  /**
   * 切换要操作的表
   * @param targetTable 目标表
   * @returns 返回这个表的DatabaseSession
   */
  to<T>(targetTable: Table<T>): IDatabaseSession<T>

  /**
   * 在链式调用中执行额外的代码块
   * @param scope 要执行的代码块
   * @returns 返回当前实例
   */
  run(scope: () => void): this

  /**
   * 开启一个普通作用域
   * @param scope 普通作用域
   * @returns 返回当前实例
   */
  begin<E extends DatabaseSession<T>>(scope: (it: E) => void): this

  /**
   * 开启一个事务作用域
   * @param scope 事务作用域
   * @returns 返回当前实例
   */
  beginTransaction<E extends DatabaseSession<T>>(scope: (it: E) => void): this

  /**
   * 插入一条数据
   * @param model 要插入的数据模型
   * @returns 返回当前实例
   */
  add(model: T): this

  /**
   * 插入一组数据
   * @todo
   * @param models 要插入的数据模型数组
   * @returns 返回当前实例
   */
  adds(models: T[]): this

  /**
   * 更新一条数据
   * @param model 要更新的数据模型
   * @returns 返回当前实例
   */
  update(model: T): this

  /**
   * 更新一组数据
   * @param models 要更新的数据模型数组
   *
   * @returns 返回当前实例
   */
  updates(models: T[]): this

  /**
   * 更新所有符合条件的数据
   * @param wrapperLambda 查询条件
   * @param model 要更新的数据
   * @returns 返回当前实例
   */
  updateIf(wrapperLambda: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T>,
    model: T | ColumnValuePairs): this

  /**
   * 删除一条数据
   * @param model 要删除的数据模型
   * @returns 返回当前实例
   */
  remove(model: T): this

  /**
   * 删除一组数据
   * @param models 要删除的数据模型数组
   * @returns 返回当前实例
   */
  removes(models: T[]): this

  /**
   * 根据条件删除表中的数据
   * @param wrapperLambda 查询条件
   * @returns 返回当前实例
   */
  removeIf(wrapperLambda: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T>): this

  /**
   * 清空整个表的数据
   * @returns 返回当前实例
   */
  clear(): this

  /**
   * 清空整个表的数据并重置自增主键计数
   * @returns 返回当前实例
   */
  reset(): this

  /**
   * 根据条件查询表中的数据
   * @todo 值得注意的是，如果使用事务，在事务没有执行完毕时，你查询到的数据并不是最新的
   * @param wrapperLambda 查询条件
   * @returns 查询到的数据集合
   */
  query(wrapperLambda: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T>): T[]
}

export class DatabaseSession<T> implements IDatabaseSession<T> {
  constructor(private readonly rdbStore: relationalStore.RdbStore, private readonly targetTable: Table<T>) {
    if (targetTable.tableName !== sqliteSequences.tableName) {
      this.rdbStore.executeSync(`CREATE TABLE IF NOT EXISTS ${this.targetTable.tableName}(${this.targetTable._columnsLazy.value
        .map(column => column._columnModifier)
        .filter(Boolean)
        .join(',')})`)
    }
    if (targetTable.tableVersion > 1 && Number.isInteger(targetTable.tableVersion)) {
      const oldTableVersion: StormTableVersion | undefined =
        this.to(stormTableVersions).query(it => it.equalTo(stormTableVersions.name, targetTable.tableName))[0];
      const currentVersion = oldTableVersion?.version ?? 1;
      if (currentVersion < targetTable.tableVersion) {
        for (let ver = currentVersion + 1; ver <= targetTable.tableVersion; ver++) {
          const modificationInfo = targetTable.upVersion(ver)
          modificationInfo?.add?.forEach(item => {
            this.rdbStore.executeSync(`ALTER TABLE ${targetTable.tableName} ADD COLUMN ${item._columnModifier}`)
          })
          modificationInfo?.remove?.forEach(item => {
            this.rdbStore.executeSync(`ALTER TABLE ${targetTable.tableName} DROP COLUMN ${item._fieldName} ${item._dataType}`)
          })
        }
        if (oldTableVersion) {
          this.to(stormTableVersions).updateIf(it => it.equalTo(stormTableVersions.name, targetTable.tableName),
            [[stormTableVersions.version, targetTable.tableVersion]])
        } else {
          this.to(stormTableVersions).add({ name: targetTable.tableName, version: targetTable.tableVersion })
        }
      }
    }
  }

  private modelToValueBucket(model: T): relationalStore.ValuesBucket {
    const valueBucket: relationalStore.ValuesBucket = {}
    for (const key of Object.keys(model)) {
      const column = getSqlColumn(this.targetTable._objectConstructor, key)
      if (column instanceof ReferencesColumn) {
        const idColumn = column._referencesTable._idColumnLazy.value
        valueBucket[column._fieldName] = model[key][idColumn._fieldName]
        continue
      }
      if (column instanceof Column) {
        if (column._typeConverters) {
          const currentValue = column._typeConverters.save(model[key])
          valueBucket[column._fieldName] = currentValue
          continue
        }
        valueBucket[column._fieldName] = model[key]
        continue
      }
    }
    return valueBucket
  }

  /**
   * 查询数据库并将每一列数据转成 entity
   * @param wrapper 查询条件
   * @param targetTable 查询的表
   * @returns entity 数组
   */
  private queryToEntity<T>(wrapper: RdbPredicatesWrapper<T>,
    targetTable: Table<T>): T[] {
    const entityArray: T[] = []
    const resultSet = this.rdbStore.querySync(wrapper._rdbPredicates)
    while (resultSet.goToNextRow()) {
      const entity = {} as T
      for (let i = 0; i < resultSet.columnNames.length; i++) {
        const columnName = resultSet.columnNames[i]
        const column = targetTable._columnsLazy.value.find(col => col._fieldName === columnName)
        if (column) {
          const value = resultSet.getValue(i) as ValueType
          if (column instanceof ReferencesColumn) {
            const referencesTable = column._referencesTable
            const idColumn = referencesTable?._idColumnLazy.value
            if (idColumn === undefined) {
              ErrorUtils.IdColumnNotDefined(referencesTable)
            }
            const predicates = new RdbPredicatesWrapper(referencesTable)
            predicates.equalTo(idColumn, value as ValueType)
            const model = this.queryToEntity(predicates, referencesTable)[0]
            entity[column._key] = model
            continue
          }
          if (column instanceof Column) {
            if (column._typeConverters) {
              entity[column._key] = column?._typeConverters?.restore(value)
              continue
            }
            entity[column._key] = value
            continue
          }
        }
      }
      entityArray.push(entity)
    }
    resultSet.close()
    return entityArray
  }

  to<T>(targetTable: Table<T>): DatabaseSession<T> {
    return SessionQueueManager.getSessionQueue(this.rdbStore, targetTable)
  }

  run(scope: () => void): this {
    scope()
    return this
  }

  begin<E extends DatabaseSession<T>>(scope: (it: E) => void): this {
    scope.call(undefined, this)
    return this
  }

  beginTransaction<E extends DatabaseSession<T>>(scope: (it: E) => void): this {
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
    if (!models.length) {
      return this
    }

    const valueBuckets = models.map((item => {
      return this.modelToValueBucket(item)
    }))

    const idColumn = this.targetTable._idColumnLazy.value
    if (idColumn !== undefined && idColumn._isAutoincrement && idColumn._dataType === 'INTEGER') {
      // 查询SqlSequence，用于记录自增信息
      const sqlSequenceArray = this.to(sqliteSequences).query()
      // 更新每个值桶中的主键字段
      valueBuckets.forEach((valueBucket, index) => {
        if (valueBucket[idColumn._fieldName] == null) {
          // 获取表对应的最新自增id
          const sqlSequence = sqlSequenceArray.find((value) => value.name === this.targetTable.tableName)
          if (sqlSequence) {
            valueBucket[idColumn._fieldName] = sqlSequence.seq += 1
          } else {
            // 如果没有找到序列，则创建一个新的序列
            const newSqlSequence: SqliteSequence = { name: this.targetTable.tableName, seq: 1 }
            valueBucket[idColumn._fieldName] = newSqlSequence.seq
            sqlSequenceArray.push(newSqlSequence)
          }
        }
        this.rdbStore.insertSync(this.targetTable.tableName, valueBucket)
        models[index][idColumn._key] = valueBucket[idColumn._fieldName]
      })
      return this
    }
    for (const valueBucket of valueBuckets) {
      this.rdbStore.insertSync(this.targetTable.tableName, valueBucket)
    }
    return this
  }

  update(model: T): this {
    return this.updates([model])
  }

  updates(models: T[]): this {
    if (!models.length) {
      return this
    }

    const idColumn = this.targetTable._idColumnLazy.value
    if (!idColumn) {
      ErrorUtils.IdColumnNotDefined(this.targetTable)
    }
    models
      .map(item => this.modelToValueBucket(item))
      .forEach(item => {
        const wrapper = new RdbPredicatesWrapper(this.targetTable).equalTo(idColumn,
          item[idColumn._fieldName] as ValueType)
        this.rdbStore.updateSync(item, wrapper._rdbPredicates)
      })
    return this
  }

  updateIf(wrapperLambda: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T>,
    model: T | ColumnValuePairs): this {
    if (Array.isArray(model)) {
      const valueBucket: relationalStore.ValuesBucket = model.reduce((acc, [column, value]) => {
        acc[column._fieldName] = value
        return acc
      }, {} as T)
      this.rdbStore.updateSync(valueBucket,
        wrapperLambda(new RdbPredicatesWrapper(this.targetTable))._rdbPredicates)
      return this
    }
    this.rdbStore.updateSync(this.modelToValueBucket(model as T),
      wrapperLambda(new RdbPredicatesWrapper(this.targetTable))._rdbPredicates)
    return this
  }

  remove(model: T): this {
    this.removes([model])
    return this
  }

  removes(models: T[]): this {
    if (!models.length) {
      return this
    }
    const idColumn = this.targetTable._idColumnLazy.value
    if (!idColumn) {
      ErrorUtils.IdColumnNotDefined(this.targetTable)
    }
    const valueBuckets = models.map((item => {
      return this.modelToValueBucket(item)
    }))
    valueBuckets
      .forEach(item => {
        const wrapper =
          new RdbPredicatesWrapper(this.targetTable).equalTo(idColumn, item[idColumn._fieldName] as ValueType)
        this.rdbStore.deleteSync(wrapper._rdbPredicates)
      })
    return this
  }

  removeIf(wrapperLambda: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T>): this {
    this.rdbStore.deleteSync(wrapperLambda(new RdbPredicatesWrapper(this.targetTable))._rdbPredicates)
    return this
  }

  clear(): this {
    try {
      this.rdbStore.deleteSync(new RdbPredicatesWrapper(this.targetTable)._rdbPredicates)
    } finally {
      return this
    }
  }

  reset(): this {
    try {
      this.rdbStore.deleteSync(new RdbPredicatesWrapper(this.targetTable)._rdbPredicates)
      this
        .to(sqliteSequences)
        .removeIf(it => it.equalTo(sqliteSequences.name, this.targetTable.tableName))
    } finally {
      return this
    }
  }

  query(wrapperLambda: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T> = (wrapper) => {
    return wrapper
  }): T[] {
    return this.queryToEntity(wrapperLambda(new RdbPredicatesWrapper(this.targetTable)), this.targetTable)
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