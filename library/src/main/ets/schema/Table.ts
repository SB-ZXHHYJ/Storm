import { relationalStore, ValueType } from '@kit.ArkData'
import { getSqlColumn } from '../annotation/SqlColumn'
import { getSqlTable } from '../annotation/SqlTable'
import { ErrorUtils } from '../utils/ErrorUtils'
import { LazyInitValue } from '../utils/LazyInitValue'
import { Column } from './Column'

export type TableUpdateInfo = {
  /**
   * 新增的列数组，表示在当前版本中添加的列
   */
  add?: Column<ValueType, any>[];

  /**
   * 移除的列数组，表示在当前版本中移除的列
   */
  remove?: Column<ValueType, any>[];
}

export interface ITable {
  /**
   * Table绑定类型的空构造函数
   */
  _objectConstructor?: ObjectConstructor
  /**
   * 表名
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
  upVersion(_version: number): TableUpdateInfo {
    return undefined
  }

  readonly tableVersion: number = 1

  abstract readonly tableName: string

  readonly _objectConstructor?: ObjectConstructor

  readonly _columnsLazy = new LazyInitValue<Column<ValueType, any>[]>(() => {
    return Object.keys(this).map((item) => {
      return this[item]
    }).filter((item) => {
      return item instanceof Column
    })
  })

  readonly _idColumnLazy = new LazyInitValue<Column<ValueType, any>>(() => {
    return this._columnsLazy.value.find((item) => {
      return item._isPrimaryKey
    })
  })

  readonly _modelMapValueBucket = (model: T) => {
    const valueBucket: relationalStore.ValuesBucket = {}
    for (const key of Object.keys(model)) {
      const column = getSqlColumn(this._objectConstructor, key)
      if (column === undefined) {
        continue
      }
      switch (true) {
        case column._typeConverters !== undefined: {
          const currentValue = column._typeConverters.save(model[key])
          valueBucket[column._fieldName] = currentValue
          break
        }
        case column._objectConstructor !== undefined: {
          const columnBindTable = getSqlTable(column._objectConstructor)
          if (columnBindTable) {
            const idColumn = columnBindTable._idColumnLazy.value
            if (idColumn) {
              valueBucket[column._fieldName] = model[key][idColumn._fieldName]
              continue
            }
            ErrorUtils.IdColumnNotDefined(columnBindTable)
          }
          break
        }
        default: {
          valueBucket[column._fieldName] = model[key]
          break
        }
      }
    }
    return valueBucket
  }
}

