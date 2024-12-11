import { Column, IIndex, SupportValueType } from './Column';

export abstract class Table<M> {
  /**
   * 仅防止编译器认为泛型M没有被使用而将其移除
   */
  protected readonly nothing: M

  /**
   * 表中所有Column的数组
   */
  readonly tableAllColumns: readonly Column<SupportValueType, any>[] = []

  /**
   * 表中被指定主键的Column数组
   */
  readonly tableIdColumns: readonly Column<SupportValueType, any>[] = []

  /**
   * 表的所有索引
   */
  readonly tableIndexes: readonly IIndex[] = []

  /**
   * 版本号，必须为整数，且不可小于1,默认为1
   */
  readonly tableVersion: number = 1

  /**
   * Table的名称
   */
  abstract readonly tableName: string
}