import { IColumn, IIndexColumn } from './Column';

export abstract class Table<M> {
  /**
   * 仅防止编译器认为泛型M没有被使用而将其移除
   */
  protected readonly nothing: M

  /**
   * 表中所有列的数组，但不包括索引列
   */
  readonly tableColumns: readonly IColumn[] = []

  /**
   * 表中被指定为主键的列数组
   */
  readonly tableIdColumns: readonly IColumn[] = []

  /**
   * 表中所有索引列的数组
   */
  readonly tableIndexColumns: readonly IIndexColumn[] = []

  /**
   * 表的名称
   */
  abstract readonly tableName: string
}