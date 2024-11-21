import { relationalStore } from '@kit.ArkData'
import { Table } from '../schema/Table'
import { QueryPredicate } from '../utils/QueryPredicate'
import { sqliteSequences } from '../model/SqliteSequence'
import { Check } from '../utils/Check'
import { Column, IValueColumn, ReferencesColumn, SupportValueType } from '../schema/Column'
import { StormTableVersion, stormTableVersions } from '../model/StormTableVersion'
import { nothings } from '../model/Nothing'

type DatabaseCrudOnlyTo = Pick<DatabaseCrud<never>, 'to'>

type ColumnValuePairs = ReadonlyArray<[IValueColumn, SupportValueType]>

class SessionQueueManager {
  private constructor() {
  }

  private static readonly sessionQueueMap = new Map<string, DatabaseCrud<any>>()

  static getSessionQueue<M>(rdbStore: relationalStore.RdbStore, targetTable: Table<M>): DatabaseCrud<M> {
    if (this.sessionQueueMap.has(targetTable.tableName)) {
      return this.sessionQueueMap.get(targetTable.tableName)
    }
    const newSessionQueue = new DatabaseCrud(rdbStore, targetTable)
    this.sessionQueueMap.set(targetTable.tableName, newSessionQueue)
    return newSessionQueue
  }

  static delete(targetTable: Table<any>): void {
    this.sessionQueueMap.delete(targetTable.tableName)
  }

  static clear(): void {
    this.sessionQueueMap.clear()
  }
}

export class Database {
  private constructor(private readonly rdbStore: relationalStore.RdbStore) {
  }

  /**
   * 异步关闭数据库
   */
  async close(): Promise<void> {
    SessionQueueManager.clear()
    return this.rdbStore.close()
  }

  /**
   * 对指定Table进行增删改查操作
   * @param targetTable 要操作的Table
   * @returns {DatabaseCrud<M>}
   */
  of<M>(targetTable: Table<M>): DatabaseCrud<M> {
    return SessionQueueManager.getSessionQueue(this.rdbStore, targetTable)
  }

  /**
   * 开启一个普通lambda
   * 主要用于链式调用时执行额外的代码逻辑
   * @param scope 普通lambda
   * @returns {DatabaseCrud<Nothing>}
   */
  run(scope: (it: DatabaseCrudOnlyTo) => void): DatabaseCrud<never> {
    return SessionQueueManager.getSessionQueue(this.rdbStore, nothings).run(scope)
  }

  /**
   * 开启一个事务lambda
   * @param scope 事务lambda
   * @returns {DatabaseCrud<Nothing>}
   */
  beginTransaction(scope: (it: DatabaseCrudOnlyTo) => void): DatabaseCrud<never> {
    return SessionQueueManager.getSessionQueue(this.rdbStore, nothings).beginTransaction(scope)
  }

  /**
   * 创建Database
   * @param rdbStore relationalStore.RdbStore
   * @returns {Database}
   */
  static create(rdbStore: relationalStore.RdbStore): Database {
    return new Database(rdbStore)
  }
}

interface IDatabaseCrud<T> {
  /**
   * 切换要操作的Table
   * @param targetTable 目标Table
   * @returns 返回这个Table的DatabaseSession
   */
  to<T>(targetTable: Table<T>): IDatabaseCrud<T>

  /**
   * 开启一个普通lambda
   * 主要用于链式调用时执行额外的代码逻辑
   * @param scope 普通lambda
   * @returns 返回当前实例
   */
  run<E extends DatabaseCrud<T>>(scope: (it: E) => void): this

  /**
   * 开启一个事务lambda
   * @param scope 事务lambda
   * @returns 返回当前实例
   */
  beginTransaction<E extends DatabaseCrud<T>>(scope: (it: E) => void): this

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
   * @param predicate 查询条件
   * @param model 要更新的数据
   * @returns 返回当前实例
   */
  updateIf(predicate: (wrapper: QueryPredicate<T>) => QueryPredicate<T>,
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
   * 根据条件删除Table中的数据
   * @param wrapperLambda 查询条件
   * @returns 返回当前实例
   */
  removeIf(wrapperLambda: (wrapper: QueryPredicate<T>) => QueryPredicate<T>): this

  /**
   * 清空整个Table的数据并重置自增主键计数
   * @returns 返回当前实例
   */
  clear(): this

  /**
   * 清空整个Table的数据并重置自增主键计数
   * @returns 返回当前实例
   */
  delete(): DatabaseCrudOnlyTo

  /**
   * 指定条件创建DatabaseQuery
   * @todo 值得注意的是，如果使用事务，在事务没有执行完毕时，你查询到的数据并不是最新的
   * @param predicate 查询条件
   * @returns DatabaseQuery
   */
  query(predicate: (wrapper: QueryPredicate<T>) => QueryPredicate<T>): DatabaseQuery<T>
}

export class DatabaseCrud<T> implements IDatabaseCrud<T> {
  constructor(private readonly rdbStore: relationalStore.RdbStore, private readonly targetTable: Table<T>) {
    Check.checkTableAndColumns(targetTable)
    if (!Object.is(targetTable, sqliteSequences) && !Object.is(targetTable, nothings)) {
      this.rdbStore.executeSync(`CREATE TABLE IF NOT EXISTS ${this.targetTable.tableName}(${this.targetTable._tableAllColumns
        .map(column => column._columnModifier)
        .join(',')})`)
    }
    if (targetTable.tableVersion > 1) {
      const oldTableVersion: StormTableVersion | undefined =
        this.to(stormTableVersions).query(it => it.equalTo(stormTableVersions.name, targetTable.tableName))[0]
      const currentVersion = oldTableVersion?.version ?? 1;
      if (currentVersion < targetTable.tableVersion) {
        this.beginTransaction(() => {
          const resultSet = this.rdbStore.querySync(new QueryPredicate(targetTable).getRdbPredicates())
          const backupTableName = `backup_${targetTable.tableName}`
          // 备份表的名称
          const newFieldNames = targetTable._tableAllColumns.map(item => item._fieldName)
          // 获取目标表的所有字段名称
          const copyFieldNames = resultSet.columnNames.filter(item => newFieldNames.includes(item))
          // 从结果集中筛选出需要复制的字段名称
          resultSet.close()
          // 关闭结果集，释放资源
          rdbStore.executeSync(`CREATE TABLE ${backupTableName}(${targetTable._tableAllColumns.map(item => item._columnModifier)// 创建备份表，结构与目标表相同
            .join(',')})`)
          rdbStore.executeSync(`INSERT INTO ${backupTableName}(${copyFieldNames.join(',')}) SELECT ${copyFieldNames.join(',')} FROM ${targetTable.tableName}`)
          // 将目标表中需要的字段数据插入到备份表
          rdbStore.executeSync(`DROP TABLE ${targetTable.tableName}`)
          // 删除原始目标表
          rdbStore.executeSync(`ALTER TABLE ${backupTableName} RENAME TO ${targetTable.tableName}`)
          // 将备份表重命名为原始目标表的名称
          if (oldTableVersion) {
            this
              .to(stormTableVersions)
              .updateIf(it => it.equalTo(stormTableVersions.name, targetTable.tableName),
                [[stormTableVersions.version, targetTable.tableVersion]])
          } else {
            this
              .to(stormTableVersions)
              .add({ name: targetTable.tableName, version: targetTable.tableVersion })
          }
        })
      }
    }
  }

  private modelToValueBucket(model: T): relationalStore.ValuesBucket {
    const valueBucket: relationalStore.ValuesBucket = {}
    for (const key of Object.keys(model)) {
      const column = this.targetTable._tableAllColumns.find(it => it._key === key)
      if (column instanceof ReferencesColumn) {
        Check.checkTableHasAtMostOneIdColumn(column._referencesTable)
        const idColumn = column._referencesTable._tableIdColumns[0]
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

  to<T>(targetTable: Table<T>): DatabaseCrud<T> {
    return SessionQueueManager.getSessionQueue(this.rdbStore, targetTable)
  }

  run<E extends DatabaseCrud<T>>(scope: (it: E) => void): this {
    scope.call(scope, this)
    return this
  }

  beginTransaction<E extends DatabaseCrud<T>>(scope: (it: E) => void): this {
    try {
      this.rdbStore.beginTransaction()
      scope.call(scope, this)
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

    const idColumn = this.targetTable._tableIdColumns[0]
    if (idColumn !== undefined && idColumn._isAutoincrement && idColumn._dataType === 'INTEGER') {
      // 更新每个值桶中的主键字段
      valueBuckets.forEach((valueBucket, index) => {
        if (valueBucket[idColumn._fieldName] === undefined) {
          const sqlSequence = this
            .to(sqliteSequences)
            .query(it => it.equalTo(sqliteSequences.name, this.targetTable.tableName))
            .firstOrNull()
          if (sqlSequence) {
            valueBucket[idColumn._fieldName] = sqlSequence.seq + 1
          } else {
            valueBucket[idColumn._fieldName] = 1
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
    const idColumn = this.targetTable._tableIdColumns[0]
    Check.checkTableHasIdColumn(this.targetTable)
    models
      .map(item => this.modelToValueBucket(item))
      .forEach(item => {
        const wrapper = new QueryPredicate(this.targetTable).equalTo(idColumn,
          item[idColumn._fieldName] as SupportValueType)
        this.rdbStore.updateSync(item, wrapper.getRdbPredicates())
      })
    return this
  }

  updateIf(predicate: (wrapper: QueryPredicate<T>) => QueryPredicate<T>,
    model: T | ColumnValuePairs): this {
    if (Array.isArray(model)) {
      const valueBucket: relationalStore.ValuesBucket = model.reduce((acc, [column, value]) => {
        acc[column._fieldName] = value
        return acc
      }, {} as T)
      this.rdbStore.updateSync(valueBucket,
        predicate(new QueryPredicate(this.targetTable)).getRdbPredicates())
      return this
    }
    this.rdbStore.updateSync(this.modelToValueBucket(model as T),
      predicate(new QueryPredicate(this.targetTable)).getRdbPredicates())
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
    const idColumn = this.targetTable._tableIdColumns[0]
    Check.checkTableHasIdColumn(this.targetTable)
    const valueBuckets = models.map((item => {
      return this.modelToValueBucket(item)
    }))
    valueBuckets
      .forEach(item => {
        const wrapper =
          new QueryPredicate(this.targetTable).equalTo(idColumn, item[idColumn._fieldName] as SupportValueType)
        this.rdbStore.deleteSync(wrapper.getRdbPredicates())
      })
    return this
  }

  removeIf(wrapperLambda: (wrapper: QueryPredicate<T>) => QueryPredicate<T>): this {
    this.rdbStore.deleteSync(wrapperLambda(new QueryPredicate(this.targetTable)).getRdbPredicates())
    return this
  }

  clear(): this {
    try {
      this.rdbStore.deleteSync(new QueryPredicate(this.targetTable).getRdbPredicates())
      this
        .to(sqliteSequences)
        .removeIf(it => it.equalTo(sqliteSequences.name, this.targetTable.tableName))
    } finally {
      return this
    }
  }

  delete(): DatabaseCrudOnlyTo {
    try {
      this.rdbStore.executeSync(`DROP TABLE IF EXISTS ${this.targetTable.tableName}`)
      SessionQueueManager.delete(this.targetTable)
    } finally {
      return this
    }
  }

  query(predicate: (wrapper: QueryPredicate<T>) => QueryPredicate<T> = (wrapper) => {
    return wrapper
  }): DatabaseQuery<T> {
    return new DatabaseQuery(this.rdbStore, predicate(new QueryPredicate(this.targetTable)), this.targetTable)
  }
}

interface IDatabaseQuery<T> {
  /**
   * 获取DatabaseQuery的长度
   * @todo 除非你只想获取长度而不执行其他操作，否则不建议你使用它
   * @returns DatabaseQuery的行数
   */
  get length(): number

  /**
   * 返回DatabaseQuery的全部实体
   * @returns 包含所有实体的只读数组
   */
  toList(): ReadonlyArray<T>

  /**
   * 获取DatabaseQuery的第一个实体
   * @returns 第一个实体
   * @throws 如果DatabaseQuery为空，抛出错误
   */
  first(): T

  /**
   * 获取DatabaseQuery的第一个实体，如果不存在则返回undefined
   * @returns 第一个实体或undefined
   */
  firstOrNull(): T | undefined
}

export class DatabaseQuery<T> implements IDatabaseQuery<T> {
  constructor(
    private readonly rdbStore: relationalStore.RdbStore,
    private readonly predicate: QueryPredicate<T>,
    private readonly targetTable: Table<T>
  ) {
  }

  private restore(column: Column<SupportValueType, any>, value: SupportValueType | undefined) {
    if (column instanceof ReferencesColumn) {
      const referencesTable = column._referencesTable
      Check.checkTableHasAtMostOneIdColumn(column._referencesTable)
      const idColumn = referencesTable?._tableIdColumns[0]
      const predicates = new QueryPredicate(referencesTable)
      predicates.equalTo(idColumn, value as SupportValueType)
      const model = this.queryOne(predicates, referencesTable)
      return model
    }
    if (column instanceof Column && column._typeConverters) {
      return column._typeConverters?.restore(value)
    }
    return value
  }

  private queryOne<T>(
    wrapper: QueryPredicate<T>,
    targetTable: Table<T>): T | undefined {
    const resultSet = this.rdbStore.querySync(wrapper.getRdbPredicates())
    try {
      while (resultSet.goToNextRow()) {
        const entity = {} as T
        for (let i = 0; i < resultSet.columnNames.length; i++) {
          const columnName = resultSet.columnNames[i]
          const column = targetTable._tableAllColumns.find(col => col._fieldName === columnName)
          if (column) {
            entity[column._key] = this.restore(column, resultSet.getValue(i) as SupportValueType)
          }
        }
        return entity
      }
    } finally {
      resultSet.close()
    }
    return undefined
  }

  [Symbol.iterator](): Iterator<T> {
    const resultSet = this.rdbStore.querySync(this.predicate.getRdbPredicates())
    return {
      next: () => {
        if (resultSet.goToNextRow()) {
          const entity = {} as T
          for (let i = 0; i < resultSet.columnNames.length; i++) {
            const columnName = resultSet.columnNames[i];
            const column = this.targetTable._tableAllColumns.find(item => item._fieldName === columnName)
            const value = resultSet.getValue(i) as SupportValueType
            if (column && value) {
              entity[column._key] = this.restore(column, value)
            }
          }
          return { done: false, value: entity }
        }
        return { done: true, value: resultSet.close() }
      },
      return: () => {
        return { done: true, value: resultSet.close() }
      },
      throw: (error) => {
        resultSet.close()
        throw error
      }
    }
  }

  get length() {
    const resultSet = this.rdbStore.querySync(this.predicate.getRdbPredicates())
    try {
      return resultSet.rowCount
    } finally {
      resultSet.close()
    }
  }

  toList(): ReadonlyArray<T> {
    const list: T[] = []
    for (const element of this) {
      list.push(element)
    }
    return list as ReadonlyArray<T>
  }

  first(): T {
    const first = this.firstOrNull()
    if (first) {
      return first
    }
    throw Error("DatabaseQuery is empty.")
  }

  firstOrNull(): T | undefined {
    for (const first of this) {
      return first
    }
    return undefined
  }
}

export namespace database {
  export declare let globalDatabase: Database

  /**
   * @see globalDatabase
   */
  export async function close(): Promise<void> {
    return globalDatabase!!.close().finally(() => {
      globalDatabase = null
    })
  }

  /**
   * @see globalDatabase
   */
  export function of<M>(targetTable: Table<M>): DatabaseCrud<M> {
    return globalDatabase!!.of(targetTable)
  }

  /**
   * @see globalDatabase
   */
  export function run(scope: (it: DatabaseCrudOnlyTo) => void) {
    return globalDatabase!!.run(scope)
  }

  /**
   * @see globalDatabase
   */
  export function beginTransaction(scope: (it: DatabaseCrudOnlyTo) => void) {
    return globalDatabase!!.beginTransaction(scope)
  }
}