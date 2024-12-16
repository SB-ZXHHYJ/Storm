import { ColumnTypes, IndexColumn } from './Column';

export abstract class Table<Model> {
  /**
   * 仅防止编译器认为泛型 Model 没有被使用而将其移除
   */
  protected readonly model: Model

  /**
   * Table 中所有 Column 的数组，但不包括 IndexColumn
   */
  readonly tableColumns: ReadonlyArray<ColumnTypes> = []

  /**
   * Table 中被指定为 Id 的 Column 数组
   */
  readonly tableIdColumns: ReadonlyArray<ColumnTypes> = []

  /**
   * Table 中所有 IndexColumn 的数组
   */
  readonly tableIndexColumns: ReadonlyArray<IndexColumn> = []

  /**
   * Table 的名称
   */
  abstract readonly tableName: string
}