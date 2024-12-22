import { ColumnTypes, ExtractColumnKey } from '../schema/Column'
import { ExtractTableModel, Table } from '../schema/Table'
import { Cursor } from './Cursor'
import { QueryPredicate } from './QueryPredicate'

export type QueryReturnTypes<Model, QueryColumns extends ColumnTypes[]> =
  QueryColumns['length'] extends 0 ? Model : Pick<Model, ExtractColumnKey<QueryColumns[number]>>

export interface IDatabaseDao<T extends Table<any>, M extends ExtractTableModel<T> = ExtractTableModel<T>> {
  /**
   * 开启一个 lambda 空间
   * @param scope lambda
   * @returns {IDatabaseDao}
   */
  begin(scope: (it: this) => void): this

  /**
   * 开启一个异步的 lambda 空间
   * @param scope lambda
   * @returns {this}
   */
  beginAsync(scope: (it: this) => void): Promise<void>

  /**
   * 开启一个事务的 lambda 空间
   * @param scope lambda
   * @returns {this}
   */
  beginTransaction(scope: (it: this) => void): this

  /**
   * 插入一条数据
   * @param model 要插入的数据
   * @returns {this}
   */
  add(model: M): this

  /**
   * 插入一组数据
   * @param models 要插入的数据
   * @returns {this}
   */
  adds(models: M[]): this

  /**
   * 更新一条数据
   *
   * 注意表中要存在唯一主键，否则将会抛出异常
   * @param model 要更新的数据
   * @returns {this}
   */
  update(model: M): this

  /**
   * 更新一组数据
   *
   * 注意表中要存在唯一主键，否则将会抛出异常
   * @param models 要更新的数据
   * @returns {this}
   */
  updates(models: M[]): this

  /**
   * 更新所有符合条件的数据
   * @param predicate 查询条件
   * @param model 要更新的数据
   * @returns {this}
   */
  updateIf(predicate: (it: QueryPredicate<M>) => QueryPredicate<M>, model: Partial<M>): this

  /**
   * 删除一条数据
   *
   * 注意表中要存在唯一主键，否则将会抛出异常
   * @param model 要删除的数据
   * @returns {this}
   */
  remove(model: M): this

  /**
   * 删除一组数据
   *
   * 注意表中要存在唯一主键，否则将会抛出异常
   * @param models 要删除的数据
   * @returns {this}
   */
  removes(models: M[]): this

  /**
   * 根据条件删除表中的数据
   * @param predicate 查询条件
   * @returns {this}
   */
  removeIf(predicate: (it: QueryPredicate<M>) => QueryPredicate<M>): this

  /**
   * 查询符合指定条件的数据条数
   * @param predicate 查询条件
   * @returns 满足条件的数据条数
   */
  count(predicate?: (it: QueryPredicate<M>) => QueryPredicate<M>): number

  /**
   * 根据指定条件查询实体
   * @param predicate 查询条件
   * @returns 查询到的实体的数组
   */
  toList<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M>,
    ...columns: Columns): readonly QueryReturnTypes<M, Columns>[]

  /**
   * 获取满足指定条件的第一个实体
   * @param predicate 查询条件
   * @returns 第一个满足条件的实体
   * @throws 如果结果为空，抛出错误
   */
  first<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M>,
    ...columns: Columns): QueryReturnTypes<M, Columns>

  /**
   * 获取满足指定条件的第一个实体
   * @param predicate 查询条件
   * @returns 第一个满足条件的实体或 null
   */
  firstOrNull<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M>,
    ...columns: Columns): QueryReturnTypes<M, Columns> | null

  /**
   * 获取满足指定条件的最后一个实体
   * @param predicate 查询条件
   * @throws 如果结果为空，抛出错误
   * @returns 最后一个满足条件的实体
   */
  last<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M>,
    ...columns: Columns): QueryReturnTypes<M, Columns>

  /**
   * 获取满足指定条件的最后一个实体
   * @param predicate 查询条件
   * @returns 最后一个满足条件的实体或 null
   */
  lastOrNull<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M>,
    ...columns: Columns): QueryReturnTypes<M, Columns> | null

  /**
   * 返回一个游标对象，以便对符合条件的数据进行操作
   *
   * 注意如果不使用了务必要关闭游标
   * @param predicate 查询条件
   * @returns 游标操作对象，用于遍历和操作查询结果
   */
  toCursor<Columns extends ColumnTypes[]>(
    predicate: (it: QueryPredicate<M>) => QueryPredicate<M>,
    ...columns: Columns): Cursor<QueryReturnTypes<M, Columns>>

}