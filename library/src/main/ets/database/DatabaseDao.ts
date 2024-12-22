import { relationalStore } from '@kit.ArkData'
import { ExtractTableModel, Table, UseTableOptions } from '../schema/Table'
import { QueryPredicate } from './QueryPredicate'
import { Check } from '../common/Check'
import { Column, ColumnTypes, ReferencesColumn, SupportValueTypes } from '../schema/Column'
import { IDatabaseDao, QueryReturnTypes } from './IDatabaseDao'
import { Cursor } from './Cursor'

export class DatabaseDao<T extends Table<any>, M
extends ExtractTableModel<T> = ExtractTableModel<T>> implements IDatabaseDao<T, M> {
  private readonly useOptions = this.targetTable[UseTableOptions]()

  constructor(
    private readonly rdbStore: relationalStore.RdbStore,
    private readonly targetTable: T) {
  }

  private modelToValueBucket(
    model: M,
    columns: readonly ColumnTypes[] = this.useOptions.columns): relationalStore.ValuesBucket {
    const vb: relationalStore.ValuesBucket = {}
    for (const column of columns) {
      if (column instanceof ReferencesColumn) {
        Check.checkTableHasAtMostOneIdColumn(column.referencesTable)
        const useOptions = column.referencesTable[UseTableOptions]()
        const idColumn = useOptions.idColumns[0]
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

  private valueBucketToModel(
    inputVb: relationalStore.ValuesBucket,
    columns: readonly ColumnTypes[] = this.useOptions.columns): M {
    const vb = {}
    for (const column of columns) {
      if (column instanceof ReferencesColumn) {
        Check.checkTableHasAtMostOneIdColumn(column.referencesTable)
        const useOptions = column.referencesTable[UseTableOptions]()
        const idColumn = useOptions.idColumns[0]
        const id = inputVb[column.fieldName] as SupportValueTypes
        if (id) {
          vb[column.key] = new DatabaseDao(this.rdbStore, column.referencesTable)
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
    return vb as M
  }

  begin(scope: (it: this) => void): this {
    scope(this)
    return this
  }

  async beginAsync(scope: (it: this) => void): Promise<void> {
    return new Promise((resolve) => {
      resolve(scope(this))
    })
  }

  beginTransaction(scope: (it: this) => void): this {
    try {
      this.rdbStore.beginTransaction()
      scope(this)
      this.rdbStore.commit()
    } catch (e) {
      this.rdbStore.rollBack()
      throw e
    }
    return this
  }

  add(model: M): this {
    return this.adds([model])
  }

  adds(models: M[]): this {
    if (!models.length) {
      return this
    }

    const valueBuckets = models.map((item => {
      return this.modelToValueBucket(item)
    }))

    Check.checkTableHasAtMostOneIdColumn(this.targetTable)
    const idColumn = this.useOptions.idColumns[0]
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

  update(model: M): this {
    return this.updates([model])
  }

  updates(models: M[]): this {
    if (!models.length) {
      return this
    }
    Check.checkTableHasIdColumn(this.targetTable)
    const idColumn = this.useOptions.idColumns[0]
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

  updateIf(predicate: (it: QueryPredicate<M>) => QueryPredicate<M>, model: Partial<M>): this {
    if (Object.keys(model).length === 0) {
      return this
    }
    const rdbPredicates = predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates()
    this.rdbStore.updateSync(this.modelToValueBucket(model as M), rdbPredicates)
    return this
  }

  remove(model: M): this {
    this.removes([model])
    return this
  }

  removes(models: M[]): this {
    if (!models.length) {
      return this
    }
    Check.checkTableHasIdColumn(this.targetTable)
    const idColumn = this.useOptions.idColumns[0]
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

  removeIf(predicate: (it: QueryPredicate<M>) => QueryPredicate<M>): this {
    this.rdbStore.deleteSync(predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates())
    return this
  }

  count(predicate: (it: QueryPredicate<M>) => QueryPredicate<M> = it => it): number {
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates())
    try {
      return resultSet.rowCount
    } finally {
      resultSet.close()
    }
  }

  toList<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M> = it => it,
    ...columns: Columns): readonly QueryReturnTypes<M, Columns>[] {
    const realColumns = columns.length === 0 ? undefined : columns
    const resultSet = this.rdbStore.querySync(predicate(QueryPredicate.select(this.targetTable)).getRdbPredicates(),
      realColumns?.map(item => item.fieldName))
    try {
      const list: M[] = []
      while (resultSet.goToNextRow()) {
        list.push(this.valueBucketToModel(resultSet.getRow(), realColumns))
      }
      return list
    } finally {
      resultSet.close()
    }
  }

  first<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M> = it => it,
    ...columns: Columns): QueryReturnTypes<M, Columns> {
    const first = this.firstOrNull(predicate, ...columns)
    if (first) {
      return first
    }
    throw Error("Query is empty.")
  }

  firstOrNull<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M> = it => it,
    ...columns: Columns): QueryReturnTypes<M, Columns> | null {
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

  last<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<M>) => QueryPredicate<M> = it => it,
    ...columns: Columns): QueryReturnTypes<M, Columns> {
    const last = this.lastOrNull(predicate, ...columns)
    if (last) {
      return last
    }
    throw Error("Query is empty.")
  }

  lastOrNull<Columns extends ColumnTypes[]>(predicate: (it: QueryPredicate<M>) => QueryPredicate<M> = it => it,
    ...columns: Columns): QueryReturnTypes<M, Columns> | null {
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

  toCursor<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M> = it => it,
    ...columns: Columns): Cursor<QueryReturnTypes<M, Columns>> {
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
      const list: M[] = []
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