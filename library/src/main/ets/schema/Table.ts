import { Column, SupportValueType } from './Column';

export abstract class Table<T> {
  protected readonly nothing: T

  /**
   * 表中所有Column的数组
   */
  readonly tableAllColumns: readonly Column<SupportValueType, any>[] = []

  /**
   * 表中被指定主键的Column数组
   */
  readonly tableIdColumns: readonly Column<SupportValueType, any>[] = []

  /**
   * 版本号，必须为整数，且不可小于1,默认为1
   */
  readonly tableVersion: number = 1

  /**
   * Table的名称
   */
  abstract readonly tableName: string
}