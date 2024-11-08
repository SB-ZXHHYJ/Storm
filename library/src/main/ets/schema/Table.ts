import { relationalStore, ValueType } from '@kit.ArkData'
import { getSqlColumn } from '../annotation/SqlColumn'
import { ErrorUtils } from '../utils/ErrorUtils'
import { LazyInitValue } from '../utils/LazyInitValue'
import { Column } from './Column'

type TableModificationInfo = {
  add?: Column<ValueType, any>[]
  remove?: Column<ValueType, any>[]
}

export interface ITable {
  /**
   * `Table`绑定类型的空构造函数
   */
  _objectConstructor?: ObjectConstructor
  /**
   * 表名
   */
  tableName: string
  /**
   * 版本号，必须为整数，且不可小于`1`,默认为`1`
   */
  tableVersion: number

  /**
   * 触发版本升级时将被调用
   * 比如本地数据库的版本为`1`，最新数据库版本为`3`，这个函数将会调用`3`-`1`次，分别是`upVersion(2)`、`upVersion(3)`
   * @param version 当前`Table`的版本
   * @returns 返回这个版本的`Table`的修改信息
   */
  upVersion(version: number): TableModificationInfo[] | undefined
}

export abstract class Table<T> implements ITable {
  upVersion(_version: number) {
    return undefined
  }

  tableVersion = 1

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
          const columnBindTable = column._getColumnBindTable()
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

