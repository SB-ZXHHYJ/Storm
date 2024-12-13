import { relationalStore } from '@kit.ArkData'
import { Table } from '../schema/Table'
import { QueryPredicate } from './QueryPredicate'
import { sqliteSequences } from '../model/SqliteSequence'
import { Check } from '../utils/Check'
import { IValueColumn, ReferencesColumn, SupportValueType } from '../schema/Column'
import { stormTableVersions } from '../model/StormTableVersion'
import { nothings } from '../model/Nothing'

type DatabaseCrudOnlyTo<M> = Pick<DatabaseCrud<M>, 'to'>

type ColumnValuePairs = ReadonlyArray<[IValueColumn, SupportValueType]>

class SessionQueueManager {
  constructor(private database: Database) {
  }

  private readonly sessionQueueMap = new Map<string, DatabaseCrud<any>>()

  getSessionQueue<M>(targetTable: Table<M>): DatabaseCrud<M> {
    if (this.sessionQueueMap.has(targetTable.tableName)) {
      return this.sessionQueueMap.get(targetTable.tableName)
    }
    const newSessionQueue = new DatabaseCrud(this.database, targetTable)
    this.sessionQueueMap.set(targetTable.tableName, newSessionQueue)
    return newSessionQueue
  }

  delete(targetTable: Table<any>): void {
    this.sessionQueueMap.delete(targetTable.tableName)
  }

  clear(): void {
    this.sessionQueueMap.clear()
  }
}

export class Database {
  private readonly sessionQueueManager = new SessionQueueManager(this);

  private constructor(readonly rdbStore: relationalStore.RdbStore) {
  }

  /**
   * 异步关闭数据库
   */
  async close(): Promise<void> {
    this.sessionQueueManager.clear()
    return this.rdbStore.close()
  }

  /**
   * 对指定Table进行增删改查操作
   * @param targetTable 要操作的Table
   * @returns {DatabaseCrud<M>}
   */
  of<M>(targetTable: Table<M>): DatabaseCrud<M> {
    return this.sessionQueueManager.getSessionQueue(targetTable)
  }

  /**
   * 开启一个普通lambda
   * 主要用于链式调用时执行额外的代码逻辑
   * @param scope 普通lambda
   * @returns {DatabaseCrud<Nothing>}
   */
  run(scope: (it: DatabaseCrudOnlyTo<never>) => void): DatabaseCrud<never> {
    return this.sessionQueueManager.getSessionQueue(nothings).run(scope)
  }

  /**
   * 删除指定Table
   * @param targetTable
   */
  delete<M>(targetTable: Table<M>): void {
    this.rdbStore.executeSync(`DROP TABLE IF EXISTS ${targetTable.tableName}`)
    this.sessionQueueManager.delete(targetTable)
  }

  /**
   * 开启一个事务lambda
   * @param scope 事务lambda
   * @returns {DatabaseCrud<Nothing>}
   */
  beginTransaction(scope: (it: DatabaseCrudOnlyTo<never>) => void): DatabaseCrud<never> {
    return this.sessionQueueManager.getSessionQueue(nothings).beginTransaction(scope)
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
   * @returns 返回这个Table的IDatabaseCrud
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
  updateIf(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>, model: T | ColumnValuePairs): this

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
   * @param predicate 查询条件
   * @returns 返回当前实例
   */
  removeIf(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): this

  /**
   * 清空整个Table的数据并重置自增主键计数
   * @returns 返回当前实例
   */
  clear(): this

  /**
   * 清空整个Table的数据并重置自增主键计数
   * @returns 返回当前实例
   */
  delete(): DatabaseCrudOnlyTo<T>

  /**
   * 查询符合指定条件的数据条数
   * @param predicate 查询条件
   * @returns 满足条件的数据条数
   */
  count(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): number

  /**
   * 根据指定条件查询实体
   * @param predicate 查询条件
   * @returns 满足条件的实体的只读数组，如果结果为空则返回空数组
   */
  toList(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): ReadonlyArray<T>

  /**
   * 根据指定条件查询实体
   * @param predicate 查询条件
   * @returns 满足条件的实体的只读数组或null
   */
  toListOrNull(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): ReadonlyArray<T> | null

  /**
   * 获取满足指定条件的第一个实体
   * @param predicate 查询条件
   * @returns 第一个满足条件的实体
   * @throws 如果结果为空，抛出错误
   */
  first(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): T

  /**
   * 获取满足指定条件的第一个实体
   * @param predicate 查询条件
   * @returns 第一个满足条件的实体或null
   */
  firstOrNull(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): T | null

  /**
   * 获取满足指定条件的最后一个实体
   * @param predicate 查询条件
   * @returns 最后一个满足条件的实体
   * @throws 如果结果为空，抛出错误
   */
  last(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): T

  /**
   * 获取满足指定条件的最后一个实体
   * @param predicate 查询条件
   * @returns 最后一个满足条件的实体或null
   */
  lastOrNull(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): T | null

  /**
   * 返回一个游标对象，以便对符合条件的数据进行操作
   * @param predicate 查询条件
   * @returns 游标操作对象，用于遍历和操作查询结果，注意如果不使用了务必要关闭游标！
   */
  toCursor(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): ICursor<T>
}

export interface ICursor<T> {
  /**
   * 获取集合中元素的数量
   * @returns 集合的长度
   */
  get length(): number

  /**
   * 返回集合中的第一个元素，如果集合为空，则返回null
   * @returns 第一个元素或null
   */
  firstOrNull(): T | null

  /**
   * 返回集合中的第一个元素
   * @returns 第一个元素
   * @throws 如果结果为空，抛出错误
   */
  first(): T

  /**
   * 返回集合中的最后一个元素
   * @returns 最后一个元素或null
   */
  lastOrNull(): T | null

  /**
   * 返回集合中的最后一个元素
   * @returns 最后一个元素
   * @throws 如果结果为空，抛出错误
   */
  last(): T

  /**
   * 根据索引返回集合中的元素
   * @param index 索引位置
   * @returns 对应的元素
   * @throws 如果结果为空，抛出错误
   */
  get(index: number): T

  /**
   * 根据索引返回集合中的元素
   * @param index 索引位置
   * @returns 对应的元素或null
   */
  getOrNull(index: number): T | null

  /**
   * 返回集合中所有元素的只读数组
   * @returns 所有元素的只读数组
   */
  toList(): ReadonlyArray<T>

  /**
   * 返回集合中所有元素的只读数组
   * @returns 所有元素的只读数组或null
   */
  toListOrNull(): ReadonlyArray<T> | null

  /**
   * 关闭游标
   */
  close(): void
}

export class DatabaseCrud<T> implements IDatabaseCrud<T> {
  private readonly rdbStore: relationalStore.RdbStore;

  constructor(private readonly database: Database, private readonly targetTable: Table<T>) {
    this.rdbStore = database.rdbStore
    Check.checkTableAndColumns(targetTable)
    if (!Object.is(targetTable, sqliteSequences) && !Object.is(targetTable, nothings)) {
      this.rdbStore.executeSync(`CREATE TABLE IF NOT EXISTS ${this.targetTable.tableName}(${this.targetTable.tableAllColumns
        .map(column => column._columnModifier)
        .join(',')})`)
      // 创建表索引
      for (const index of targetTable.tableIndexes) {
        const columns = index._columns.map(it => it._fieldName).join(',')
        const unique = index._unique ? 'UNIQUE' : ''
        const order = index._order ? index._order : ''
        this.rdbStore.executeSync(`CREATE ${unique} INDEX IF NOT EXISTS ${index._name} ON ${targetTable.tableName} (${columns} ${order})`)
      }
    }
    if (targetTable.tableVersion > 1) {
      const oldTableVersion = this
        .to(stormTableVersions)
        .firstOrNull(it => it.equalTo(stormTableVersions.name, targetTable.tableName))
      if ((oldTableVersion?.version ?? 1) < targetTable.tableVersion) {
        this.beginTransaction(() => {
          const resultSet = this.rdbStore.querySync(new QueryPredicate(targetTable).getRdbPredicates())
          const backupTableName = `backup_${targetTable.tableName}`
          // 备份表的名称
          const newFieldNames = targetTable.tableAllColumns.map(item => item._fieldName)
          // 获取目标表的所有字段名称
          const copyFieldNames = resultSet.columnNames.filter(item => newFieldNames.includes(item))
          // 从结果中筛选出需要复制的字段名称
          resultSet.close()
          // 释放资源
          database.rdbStore.executeSync(`CREATE TABLE ${backupTableName}(${targetTable.tableAllColumns.map(item => item._columnModifier)// 创建备份表，结构与目标表相同
            .join(',')})`)
          // 为备份表创建索引, 与目标表相同
          for (const index of targetTable.tableIndexes) {
            const columns = index._columns.map(it => it._fieldName).join(',')
            const unique = index._unique ? 'UNIQUE' : ''
            const order = index._order ? index._order : ''
            this.rdbStore.executeSync(`CREATE ${unique} INDEX IF NOT EXISTS ${index._name} ON ${backupTableName} (${columns} ${order})`)
          }
          database.rdbStore.executeSync(`INSERT INTO ${backupTableName}(${copyFieldNames.join(',')}) SELECT ${copyFieldNames.join(',')} FROM ${targetTable.tableName}`)
          // 将目标表中需要的字段数据插入到备份表
          database.rdbStore.executeSync(`DROP TABLE ${targetTable.tableName}`)
          // 删除原始目标表
          database.rdbStore.executeSync(`ALTER TABLE ${backupTableName} RENAME TO ${targetTable.tableName}`)
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

  private modelToValueBucket(model: {}, targetTable: Table<any>): relationalStore.ValuesBucket {
    const vb: relationalStore.ValuesBucket = {}
    targetTable.tableAllColumns.forEach(column => {
      if (column instanceof ReferencesColumn) {
        Check.checkTableHasAtMostOneIdColumn(column._referencesTable)
        const idColumn = column._referencesTable.tableIdColumns[0]
        vb[column._fieldName] = model[column._key]?.[idColumn._key]
        return
      }
      if (column._typeConverters) {
        vb[column._fieldName] = column._typeConverters.save(model[column._key] ?? null)
        return
      }
      vb[column._fieldName] = model[column._key]
    })
    return vb
  }

  private valueBucketToModel<T>(inputVb: relationalStore.ValuesBucket, targetTable: Table<T>): T {
    const vb = {} as T
    targetTable.tableAllColumns.forEach(column => {
      if (column instanceof ReferencesColumn) {
        Check.checkTableHasAtMostOneIdColumn(column._referencesTable)
        vb[column._key] = this
          .to(column._referencesTable)
          .firstOrNull(it =>
          it.equalTo(column._referencesTable.tableIdColumns[0], inputVb[column._fieldName] as SupportValueType))
        return
      }
      if (column._typeConverters) {
        vb[column._key] = column._typeConverters.restore(inputVb[column._fieldName] as SupportValueType ?? null)
        return
      }
      vb[column._key] = inputVb[column._fieldName]
    })
    return vb
  }

  to<T>(targetTable: Table<T>): DatabaseCrud<T> {
    return this.database.of(targetTable);
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
      return this.modelToValueBucket(item, this.targetTable)
    }))

    const idColumn = this.targetTable.tableIdColumns[0]
    const isRowIdAlias = idColumn !== undefined && idColumn._isAutoincrement && idColumn._dataType === 'INTEGER';

    valueBuckets.forEach((valueBucket, index) => {
      // 对于id列是自增的情况下，如果id的值不是有效值(if条件判断为false的值)，则移除该列以确保使用自增值。
      if (isRowIdAlias && !valueBucket[idColumn._fieldName]) {
        delete valueBucket[idColumn._fieldName]
      }
      const rowId = this.rdbStore.insertSync(this.targetTable.tableName, valueBucket)
      if (isRowIdAlias) {
        models[index][idColumn._key] = rowId
      }
    })
    return this
  }

  update(model: T): this {
    return this.updates([model])
  }

  updates(models: T[]): this {
    if (!models.length) {
      return this
    }
    const idColumn = this.targetTable.tableIdColumns[0]
    Check.checkTableHasIdColumn(this.targetTable)
    models
      .map(item => this.modelToValueBucket(item, this.targetTable))
      .forEach(item => {
        const wrapper = new QueryPredicate(this.targetTable).equalTo(idColumn,
          item[idColumn._fieldName] as SupportValueType)
        this.rdbStore.updateSync(item, wrapper.getRdbPredicates())
      })
    return this
  }

  updateIf(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>, model: T | ColumnValuePairs): this {
    const rdbPredicates = predicate(new QueryPredicate(this.targetTable)).getRdbPredicates()
    if (Array.isArray(model)) {
      const valueBucket: relationalStore.ValuesBucket = model.reduce((acc, [column, value]) => {
        acc[column._fieldName] = value
        return acc
      }, {} as T)
      this.rdbStore.updateSync(valueBucket, rdbPredicates)
      return this
    }
    this.rdbStore.updateSync(this.modelToValueBucket(model, this.targetTable), rdbPredicates)
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
    const idColumn = this.targetTable.tableIdColumns[0]
    Check.checkTableHasIdColumn(this.targetTable)
    const valueBuckets = models.map((item => {
      return this.modelToValueBucket(item, this.targetTable)
    }))
    valueBuckets
      .forEach(item => {
        const wrapper =
          new QueryPredicate(this.targetTable).equalTo(idColumn, item[idColumn._fieldName] as SupportValueType)
        this.rdbStore.deleteSync(wrapper.getRdbPredicates())
      })
    return this
  }

  removeIf(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): this {
    this.rdbStore.deleteSync(predicate(new QueryPredicate(this.targetTable)).getRdbPredicates())
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

  delete(): DatabaseCrudOnlyTo<T> {
    this.database.delete(this.targetTable)
    return this
  }

  count(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it): number {
    const resultSet = this.rdbStore.querySync(predicate(new QueryPredicate(this.targetTable)).getRdbPredicates())
    try {
      return resultSet.rowCount
    } finally {
      resultSet.close()
    }
  }

  toList(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it): readonly T[] {
    const resultSet = this.rdbStore.querySync(predicate(new QueryPredicate(this.targetTable)).getRdbPredicates())
    try {
      const list: T[] = []
      while (resultSet.goToNextRow()) {
        list.push(this.valueBucketToModel(resultSet.getRow(), this.targetTable))
      }
      return list
    } finally {
      resultSet.close()
    }
  }

  toListOrNull(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it): readonly T[] | null {
    const list = this.toList(predicate)
    return list.length > 0 ? list : null
  }

  first(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it): T {
    const first = this.firstOrNull(predicate)
    if (first) {
      return first
    }
    throw Error("Query is empty.")
  }

  firstOrNull(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it): T | null {
    const resultSet = this.rdbStore.querySync(predicate(new QueryPredicate(this.targetTable)).getRdbPredicates())
    try {
      if (resultSet.goToFirstRow()) {
        return this.valueBucketToModel(resultSet.getRow(), this.targetTable)
      }
      return null
    } finally {
      resultSet.close()
    }
  }

  last(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it): T {
    const last = this.lastOrNull(predicate)
    if (last) {
      return last
    }
    throw Error("Query is empty.")
  }

  lastOrNull(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it): T | null {
    const resultSet = this.rdbStore.querySync(predicate(new QueryPredicate(this.targetTable)).getRdbPredicates())
    try {
      if (resultSet.goToLastRow()) {
        return this.valueBucketToModel(resultSet.getRow(), this.targetTable)
      }
      return null
    } finally {
      resultSet.close()
    }
  }

  toCursor(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it): ICursor<T> {
    const resultSet = this.rdbStore.querySync(predicate(new QueryPredicate(this.targetTable)).getRdbPredicates())
    const rowCount = resultSet.rowCount

    const firstOrNull = () => {
      if (resultSet.goToFirstRow()) {
        return this.valueBucketToModel(resultSet.getRow(), this.targetTable)
      }
      return null
    }
    const first = () => {
      const first = firstOrNull()
      if (first) {
        return first
      }
      throw Error("Query is empty.")
    }
    const lastOrNull = () => {
      if (resultSet.goToLastRow()) {
        return this.valueBucketToModel(resultSet.getRow(), this.targetTable)
      }
      return null
    }
    const last = () => {
      const last = lastOrNull()
      if (last) {
        return last
      }
      throw Error("Query is empty.")
    }
    const getOrNull = (position: number) => {
      if (position < 0 || position > rowCount - 1) {
        return null;
      }

      if (resultSet.goToRow(position)) {
        return this.valueBucketToModel(resultSet.getRow(), this.targetTable)
      }

      return null
    };
    const get = (position: number) => {
      const item = getOrNull(position)
      if (item) {
        return item
      }
      throw Error("Index out of range.")
    }
    const toListOrNull = () => {
      const list: {}[] = []
      while (resultSet.goToNextRow()) {
        list.push(this.valueBucketToModel(resultSet.getRow(), this.targetTable))
      }
      return list.length > 0 ? list as T[] : null
    }
    const toList = () => {
      const list = toListOrNull()
      if (list) {
        return list
      }
      throw Error("Query is empty.")
    }
    const close = () => resultSet.close();

    const cursor: ICursor<T> = {
      length: rowCount,
      firstOrNull: firstOrNull,
      first: first,
      lastOrNull: lastOrNull,
      last: last,
      getOrNull: getOrNull,
      get: get,
      toListOrNull: toListOrNull,
      toList: toList,
      close: close,
    }

    return cursor;
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
  export function run(scope: (it: DatabaseCrudOnlyTo<never>) => void) {
    return globalDatabase!!.run(scope)
  }

  /**
   * @see globalDatabase
   */
  export function beginTransaction(scope: (it: DatabaseCrudOnlyTo<never>) => void) {
    return globalDatabase!!.beginTransaction(scope)
  }
}