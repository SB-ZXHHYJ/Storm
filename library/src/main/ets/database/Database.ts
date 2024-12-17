import { relationalStore } from '@kit.ArkData'
import { Table, UseColumns, UseMigrations } from '../schema/Table'
import { QueryPredicate } from './QueryPredicate'
import { sqliteSequences } from '../model/SqliteSequence'
import { Check } from '../utils/Check'
import { Column, ColumnKey, ColumnTypes, ReferencesColumn, SupportValueTypes } from '../schema/Column'
import { nothings } from '../model/Nothing'

type QueryReturnTypes<Model, T
extends ColumnTypes[]> = T['length'] extends 0 ? Model : Pick<Model, ColumnKey<T[number]>>

type DatabaseCrudOnlyTo<M> = Pick<DatabaseCrud<M>, 'to'>

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
  //private readonly databaseCrudCache = new HashMap<string, DatabaseCrud<any>>()
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

export interface Cursor<T> {
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

export class DatabaseCrud<T> {
  private readonly rdbStore: relationalStore.RdbStore

  private readonly useColumns = this.targetTable[UseColumns]()

  private readonly useMigrations = this.targetTable[UseMigrations]()

  constructor(private readonly database: Database, private readonly targetTable: Table<T>) {
    this.rdbStore = database.rdbStore
    Check.checkTableAndColumns(targetTable)
    if (!Object.is(targetTable, sqliteSequences) && !Object.is(targetTable, nothings)) {
      this.rdbStore.executeSync(`CREATE TABLE IF NOT EXISTS ${this.targetTable.tableName}(${this.useColumns.columns
        .map(column => column.columnModifier)
        .join(',')})`)
      for (const index of this.useColumns.indexColumns) {
        const columns = index.columns.map(it => it.fieldName).join(',')
        const unique = index.isUnique ? 'UNIQUE' : ''
        const order = index.sortOrder ? index.sortOrder : ''
        this.rdbStore.executeSync(`CREATE ${unique} INDEX IF NOT EXISTS ${index.fieldName} ON ${targetTable.tableName} (${columns} ${order})`)
      }
    }
  }

  private modelToValueBucket(model: {}, columns?: ColumnTypes[]): relationalStore.ValuesBucket {
    const vb: relationalStore.ValuesBucket = {}
    for (const column of (columns ?? this.useColumns.columns)) {
      if (column instanceof ReferencesColumn) {
        Check.checkTableHasAtMostOneIdColumn(column.referencesTable)
        const useColumns = column.referencesTable[UseColumns]()
        const idColumn = useColumns.idColumns[0]
        vb[column.fieldName] = model[column.key]?.[idColumn.key] ?? null
        continue
      }
      if (column instanceof Column) {
        if (column.typeConverters) {
          vb[column.fieldName] = column.typeConverters.save(model[column.key] ?? null)
          continue
        }
        vb[column.fieldName] = model[column.key]
      }
    }
    return vb
  }

  private valueBucketToModel(inputVb: relationalStore.ValuesBucket, columns?: ColumnTypes[]): T {
    const vb = {} as T
    for (const column of (columns ?? this.useColumns.columns)) {
      if (column instanceof ReferencesColumn) {
        Check.checkTableHasAtMostOneIdColumn(column.referencesTable)
        const useColumns = column.referencesTable[UseColumns]()
        const idColumn = useColumns.idColumns[0]
        const id = inputVb[column.fieldName] as SupportValueTypes
        if (id) {
          vb[column.key] = this
            .to(column.referencesTable)
            .firstOrNull(it => it.equalTo(idColumn, id)) ?? null
          continue
        }
        continue
      }
      if (column instanceof Column) {
        if (column.typeConverters) {
          vb[column.key] = column.typeConverters.restore(inputVb[column.fieldName] ?? null)
          continue
        }
        vb[column.key] = inputVb[column.fieldName]
      }
    }
    return vb
  }

  /**
   * 切换要操作的Table
   * @param targetTable 目标Table
   * @returns 返回这个Table的IDatabaseCrud
   */
  to<T>(targetTable: Table<T>): DatabaseCrud<T> {
    return this.database.of(targetTable);
  }

  /**
   * 开启一个普通lambda
   * 主要用于链式调用时执行额外的代码逻辑
   * @param scope 普通lambda
   * @returns 返回当前实例
   */
  run(scope: (it: this) => void): this {
    scope.call(scope, this)
    return this
  }

  /**
   * 开启一个事务lambda
   * @param scope 事务lambda
   * @returns 返回当前实例
   */
  beginTransaction(scope: (it: this) => void): this {
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

  /**
   * 插入一条数据
   * @param model 要插入的数据模型
   * @returns 返回当前实例
   */
  add(model: T): this {
    return this.adds([model])
  }

  /**
   * 插入一组数据
   * @param models 要插入的数据模型数组
   * @returns 返回当前实例
   */
  adds(models: T[]): this {
    if (!models.length) {
      return this
    }

    const valueBuckets = models.map((item => {
      return this.modelToValueBucket(item)
    }))

    Check.checkTableHasAtMostOneIdColumn(this.targetTable)
    const idColumn = this.useColumns.idColumns[0]
    const isRowIdAlias = idColumn && idColumn.isAutoincrement && idColumn.dataType === 'INTEGER';

    valueBuckets.forEach((valueBucket, index) => {
      // 对于id列是自增的情况下，如果id的值不是有效值(if条件判断为false的值)，则移除该列以确保使用自增值。
      if (isRowIdAlias && !valueBucket[idColumn.fieldName]) {
        delete valueBucket[idColumn.fieldName]
      }
      const rowId = this.rdbStore.insertSync(this.targetTable.tableName, valueBucket)
      if (isRowIdAlias) {
        models[index][idColumn.key] = rowId
      }
    })
    return this
  }

  /**
   * 更新一条数据
   * @param model 要更新的数据模型
   * @returns 返回当前实例
   */
  update(model: T): this {
    return this.updates([model])
  }

  /**
   * 更新一组数据
   * @param models 要更新的数据模型数组
   *
   * @returns 返回当前实例
   */
  updates(models: T[]): this {
    if (!models.length) {
      return this
    }
    Check.checkTableHasIdColumn(this.targetTable)
    const idColumn = this.useColumns.idColumns[0]
    models
      .map(item => this.modelToValueBucket(item))
      .forEach(item => {
        this.rdbStore.updateSync(
          item,
          QueryPredicate
            .of(this.targetTable)
            .equalTo(idColumn, item[idColumn.fieldName] as SupportValueTypes).getRdbPredicates())
      })
    return this
  }

  /**
   * 更新所有符合条件的数据
   * @param predicate 查询条件
   * @param model 要更新的数据
   * @returns 返回当前实例
   */
  updateIf(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>, model: Partial<T>): this {
    if (Object.keys(model).length === 0) {
      return this
    }
    const rdbPredicates = predicate(QueryPredicate.of(this.targetTable)).getRdbPredicates()
    this.rdbStore.updateSync(this.modelToValueBucket(model), rdbPredicates)
    return this
  }

  /**
   * 删除一条数据
   * @param model 要删除的数据模型
   * @returns 返回当前实例
   */
  remove(model: T): this {
    this.removes([model])
    return this
  }

  /**
   * 删除一组数据
   * @param models 要删除的数据模型数组
   * @returns 返回当前实例
   */
  removes(models: T[]): this {
    if (!models.length) {
      return this
    }
    Check.checkTableHasIdColumn(this.targetTable)
    const idColumn = this.useColumns.idColumns[0]
    const valueBuckets = models.map((item => {
      return this.modelToValueBucket(item)
    }))
    valueBuckets
      .forEach(item => {
        const wrapper =
          QueryPredicate.of(this.targetTable).equalTo(idColumn, item[idColumn.fieldName] as SupportValueTypes)
        this.rdbStore.deleteSync(wrapper.getRdbPredicates())
      })
    return this
  }

  /**
   * 根据条件删除Table中的数据
   * @param predicate 查询条件
   * @returns 返回当前实例
   */
  removeIf(predicate: (it: QueryPredicate<T>) => QueryPredicate<T>): this {
    this.rdbStore.deleteSync(predicate(QueryPredicate.of(this.targetTable)).getRdbPredicates())
    return this
  }

  /**
   * 清空整个Table的数据并重置自增主键计数
   * @returns 返回当前实例
   */
  clear(): this {
    try {
      this.rdbStore.deleteSync(QueryPredicate.of(this.targetTable).getRdbPredicates())
      this
        .to(sqliteSequences)
        .removeIf(it => it.equalTo(sqliteSequences.name, this.targetTable.tableName))
    } finally {
      return this
    }
  }

  /**
   * 清空整个Table的数据并重置自增主键计数
   * @returns 返回当前实例
   */
  delete(): DatabaseCrudOnlyTo<T> {
    this.database.delete(this.targetTable)
    return this
  }

  /**
   * 查询符合指定条件的数据条数
   * @param predicate 查询条件
   * @returns 满足条件的数据条数
   */
  count(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it): number {
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.of(this.targetTable)).getRdbPredicates())
    try {
      return resultSet.rowCount
    } finally {
      resultSet.close()
    }
  }

  /**
   * 根据指定条件查询实体
   * @param predicate 查询条件
   * @returns 满足条件的实体的只读数组，如果结果为空则返回空数组
   */
  toList<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it,
    columns?: Columns): readonly QueryReturnTypes<T, Columns>[] {
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.of(this.targetTable)).getRdbPredicates(),
      columns?.map(item => item.fieldName))
    try {
      const list: T[] = []
      while (resultSet.goToNextRow()) {
        list.push(this.valueBucketToModel(resultSet.getRow(), columns))
      }
      return list
    } finally {
      resultSet.close()
    }
  }

  /**
   * 获取满足指定条件的第一个实体
   * @param predicate 查询条件
   * @returns 第一个满足条件的实体
   * @throws 如果结果为空，抛出错误
   */
  first<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it,
    columns?: Columns): QueryReturnTypes<T, Columns> {
    const first = this.firstOrNull(predicate, columns)
    if (first) {
      return first
    }
    throw Error("Query is empty.")
  }

  /**
   * 获取满足指定条件的第一个实体
   * @param predicate 查询条件
   * @returns 第一个满足条件的实体或null
   */
  firstOrNull<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it,
    columns?: Columns): QueryReturnTypes<T, Columns> | null {
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.of(this.targetTable)).getRdbPredicates(),
      columns?.map(item => item.fieldName))
    try {
      if (resultSet.goToFirstRow()) {
        return this.valueBucketToModel(resultSet.getRow(), columns)
      }
      return null
    } finally {
      resultSet.close()
    }
  }

  /**
   * 获取满足指定条件的最后一个实体
   * @param predicate 查询条件
   * @returns 最后一个满足条件的实体
   * @throws 如果结果为空，抛出错误
   */
  last<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it,
    columns?: Columns): QueryReturnTypes<T, Columns> {
    const last = this.lastOrNull(predicate, columns)
    if (last) {
      return last
    }
    throw Error("Query is empty.")
  }

  /**
   * 获取满足指定条件的最后一个实体
   * @param predicate 查询条件
   * @returns 最后一个满足条件的实体或null
   */
  lastOrNull<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it,
    columns?: Columns): QueryReturnTypes<T, Columns> | null {
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.of(this.targetTable)).getRdbPredicates(),
      columns?.map(item => item.fieldName))
    try {
      if (resultSet.goToLastRow()) {
        return this.valueBucketToModel(resultSet.getRow(), columns)
      }
      return null
    } finally {
      resultSet.close()
    }
  }

  /**
   * 返回一个游标对象，以便对符合条件的数据进行操作
   * @param predicate 查询条件
   * @returns 游标操作对象，用于遍历和操作查询结果，注意如果不使用了务必要关闭游标！
   */
  toCursor<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<T>) => QueryPredicate<T> = it => it,
    columns?: Columns): Cursor<QueryReturnTypes<T, Columns>> {
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.of(this.targetTable)).getRdbPredicates(),
      columns?.map(item => item.fieldName))
    const rowCount = resultSet.rowCount

    const firstOrNull = () => {
      if (resultSet.goToFirstRow()) {
        return this.valueBucketToModel(resultSet.getRow(), columns)
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
        return this.valueBucketToModel(resultSet.getRow(), columns)
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
        return this.valueBucketToModel(resultSet.getRow(), columns)
      }

      return null
    }
    const get = (position: number) => {
      const item = getOrNull(position)
      if (item) {
        return item
      }
      throw Error("Index out of range.")
    }
    const toListOrNull = () => {
      const list: T[] = []
      while (resultSet.goToNextRow()) {
        list.push(this.valueBucketToModel(resultSet.getRow(), columns))
      }
      return list.length > 0 ? list : null
    }
    const toList = () => {
      const list = toListOrNull()
      if (list) {
        return list
      }
      throw Error("Query is empty.")
    }
    const close = () => resultSet.close()

    return {
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