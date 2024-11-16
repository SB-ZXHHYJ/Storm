import { Column, IValueColumn, SupportValueType } from './Column';

export type TableUpdateInfo = {
  /**
   * 新增的列数组，表示在当前版本中添加的列
   */
  add?: IValueColumn[]

  /**
   * 移除的列数组，表示在当前版本中移除的列
   * @deprecated 已废弃，sqlite不支持移除列
   */
  remove?: IValueColumn[]
}

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

  /**
   * 在版本升级时被调用
   *
   * 当本地数据库的版本小于最新版本时，此函数会被多次调用，
   * 以逐步升级到最新版本。例如，如果当前版本为1，最新版本为3，
   * 则此函数将被调用两次：第一次调用 upVersion(2)，
   * 第二次调用 upVersion(3)
   *
   * @param version - 当前表的版本号，表示需要升级到的目标版本
   * @returns 返回当前版本的表修改信息，包含新增和移除的列
   */
  upVersion(version: number): TableUpdateInfo | undefined
}

export abstract class Table<T> implements ITable {
  protected readonly nothing: T

  upVersion(_version: number): TableUpdateInfo {
    return undefined
  }

  readonly _tableAllColumns: Column<SupportValueType, any>[] = []

  readonly _tableIdColumns: Column<SupportValueType, any>[] = []

  readonly tableVersion: number = 1

  abstract readonly tableName: string
}

