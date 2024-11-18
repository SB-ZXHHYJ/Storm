import { Column, SupportValueType } from './Column';

export interface ITable {
  _tableAllColumns: Column<SupportValueType, any>[]
  _tableIdColumns: Column<SupportValueType, any>[]
  /**
   * Table的名称
   */
  tableName: string
  /**
   * 版本号，必须为整数，且不可小于1,默认为1
   */
  tableVersion: number
}

export abstract class Table<T> implements ITable {
  protected readonly nothing: T

  readonly _tableAllColumns: Column<SupportValueType, any>[] = []

  readonly _tableIdColumns: Column<SupportValueType, any>[] = []

  readonly tableVersion: number = 1

  abstract readonly tableName: string
}

