import { relationalStore } from '@kit.ArkData'
import { ExtractTableModel, Table, UseColumns, UseMigrations } from '../schema/Table'
import { QueryPredicate } from './QueryPredicate'
import { SqliteSequencesTable } from '../model/SqliteSequence'
import { Check } from '../utils/Check'
import { Column, ColumnTypes, ExtractColumnKey, ReferencesColumn, SupportValueTypes } from '../schema/Column'
import { Cursor } from './Cursor'

type QueryReturnTypes<Model, QueryColumns extends ColumnTypes[]> =
  QueryColumns['length'] extends 0 ? Model : Pick<Model, ExtractColumnKey<QueryColumns[number]>>

export class DatabaseDao<T extends Table<any>, Model extends ExtractTableModel<T> = ExtractTableModel<T>> {
  private readonly useColumns = this.targetTable[UseColumns]()

  private readonly useMigrations = this.targetTable[UseMigrations]()

  constructor(private readonly rdbStore: relationalStore.RdbStore, private readonly targetTable: T) {
    Check.checkTableAndColumns(targetTable)
    if (!Object.is(targetTable, SqliteSequencesTable)) {
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

  private modelToValueBucket(
    model: Model,
    columns: readonly ColumnTypes[] = this.useColumns.columns): relationalStore.ValuesBucket {
    const vb: relationalStore.ValuesBucket = {}
    for (const column of columns) {
      if (column instanceof ReferencesColumn) {
        Check.checkTableHasAtMostOneIdColumn(column.referencesTable)
        const useColumns = column.referencesTable[UseColumns]()
        const idColumn = useColumns.idColumns[0]
        vb[column.fieldName] = model[column.prop]?.[idColumn.prop] ?? null
        continue
      }
      if (column instanceof Column) {
        if (column.typeConverters) {
          vb[column.fieldName] = column.typeConverters.save(model[column.prop] ?? null)
          continue
        }
        vb[column.fieldName] = model[column.prop]
      }
    }
    return vb
  }

  /**
   * 将 valueBucket 转回 Model
   * @param inputVb 需要转换的 valueBucket
   * @param columns 对哪些列进行处理
   * @returns {Model}
   */
  private valueBucketToModel(
    inputVb: relationalStore.ValuesBucket,
    columns: readonly ColumnTypes[] = this.useColumns.columns): Model {
    const vb = {}
    for (const column of columns) {
      if (column instanceof ReferencesColumn) {
        Check.checkTableHasAtMostOneIdColumn(column.referencesTable)
        const useColumns = column.referencesTable[UseColumns]()
        const idColumn = useColumns.idColumns[0]
        const id = inputVb[column.fieldName] as SupportValueTypes
        if (id) {
          vb[column.prop] =
            new DatabaseDao(this.rdbStore, column.referencesTable).firstOrNull(it => it.equalTo(idColumn, id)) ?? null
          continue
        }
        continue
      }
      if (column instanceof Column) {
        if (column.typeConverters) {
          vb[column.prop] = column.typeConverters.restore(inputVb[column.fieldName] ?? null)
          continue
        }
        vb[column.prop] = inputVb[column.fieldName]
      }
    }
    return vb as Model
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
  add(model: Model): this {
    return this.adds([model])
  }

  /**
   * 插入一组数据
   * @param models 要插入的数据模型数组
   * @returns 返回当前实例
   */
  adds(models: Model[]): this {
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
        models[index][idColumn.prop] = rowId
      }
    })
    return this
  }

  /**
   * 更新一条数据
   * @param model 要更新的数据模型
   * @returns 返回当前实例
   */
  update(model: Model): this {
    return this.updates([model])
  }

  /**
   * 更新一组数据
   * @param models 要更新的数据模型数组
   *
   * @returns 返回当前实例
   */
  updates(models: Model[]): this {
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
            .select(this.targetTable)
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
  updateIf(predicate: (it: QueryPredicate<Model>) => QueryPredicate<Model>, model: Partial<Model>): this {
    if (Object.keys(model).length === 0) {
      return this
    }
    const rdbPredicates = predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates()
    this.rdbStore.updateSync(this.modelToValueBucket(model as Model), rdbPredicates)
    return this
  }

  /**
   * 删除一条数据
   * @param model 要删除的数据模型
   * @returns 返回当前实例
   */
  remove(model: Model): this {
    this.removes([model])
    return this
  }

  /**
   * 删除一组数据
   * @param models 要删除的数据模型数组
   * @returns 返回当前实例
   */
  removes(models: Model[]): this {
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
          QueryPredicate.select(this.targetTable).equalTo(idColumn, item[idColumn.fieldName] as SupportValueTypes)
        this.rdbStore.deleteSync(wrapper.getRdbPredicates())
      })
    return this
  }

  /**
   * 根据条件删除Table中的数据
   * @param predicate 查询条件
   * @returns 返回当前实例
   */
  removeIf(predicate: (it: QueryPredicate<Model>) => QueryPredicate<Model>): this {
    this.rdbStore.deleteSync(predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates())
    return this
  }

  /**
   * 清空整个Table的数据并重置自增主键计数
   * @returns 返回当前实例
   */
  clear(): this {
    try {
      this.rdbStore.deleteSync(QueryPredicate.select(this.targetTable).getRdbPredicates())
    } finally {
      return this
    }
  }

  /**
   * 清空整个Table的数据并重置自增主键计数
   * @returns 返回当前实例
   */
  delete(): this {
    //this.database.delete(this.targetTable)
    return this
  }

  /**
   * 查询符合指定条件的数据条数
   * @param predicate 查询条件
   * @returns 满足条件的数据条数
   */
  count(predicate: (it: QueryPredicate<Model>) => QueryPredicate<Model> = it => it): number {
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates())
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
  toList<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<Model>) => QueryPredicate<Model> = it => it,
    ...columns: Columns): readonly QueryReturnTypes<Model, Columns>[] {
    const realColumns = columns.length === 0 ? undefined : columns
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates(),
      realColumns?.map(item => item.fieldName))
    try {
      const list: Model[] = []
      while (resultSet.goToNextRow()) {
        list.push(this.valueBucketToModel(resultSet.getRow(), realColumns))
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
    predicate: (it: QueryPredicate<Model>) => QueryPredicate<Model> = it => it,
    ...columns: Columns): QueryReturnTypes<Model, Columns> {
    const first = this.firstOrNull(predicate, ...columns)
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
    predicate: (it: QueryPredicate<Model>) => QueryPredicate<Model> = it => it,
    ...columns: Columns): QueryReturnTypes<Model, Columns> | null {
    const realColumns = columns.length === 0 ? undefined : columns
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates(),
      realColumns?.map(item => item.fieldName))
    try {
      if (resultSet.goToFirstRow()) {
        return this.valueBucketToModel(resultSet.getRow(), realColumns)
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
  last<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<Model>) => QueryPredicate<Model> = it => it,
    ...columns: Columns): QueryReturnTypes<Model, Columns> {
    const last = this.lastOrNull(predicate, ...columns)
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
  lastOrNull<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<Model>) => QueryPredicate<Model> = it => it,
    ...columns: Columns): QueryReturnTypes<Model, Columns> | null {
    const realColumns = columns.length === 0 ? undefined : columns
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates(),
      realColumns?.map(item => item.fieldName))
    try {
      if (resultSet.goToLastRow()) {
        return this.valueBucketToModel(resultSet.getRow(), realColumns)
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
  toCursor<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<Model>) => QueryPredicate<Model> = it => it,
    ...columns: Columns): Cursor<QueryReturnTypes<Model, Columns>> {
    const realColumns = columns.length === 0 ? undefined : columns
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates(),
      realColumns?.map(item => item.fieldName))
    const rowCount = resultSet.rowCount

    const firstOrNull = () => {
      if (resultSet.goToFirstRow()) {
        return this.valueBucketToModel(resultSet.getRow(), realColumns)
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
      const list: Model[] = []
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