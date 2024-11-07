import { relationalStore, ValueType } from '@kit.ArkData'
import { getSqlColumn } from '../annotation/SqlColumn'
import { ErrorUtils } from '../utils/ErrorUtils'
import { LazyInitValue } from '../utils/LazyInitValue'
import { Column } from './Column'

export interface PTable {
  _objectConstructor?: ObjectConstructor
}

interface ITable {
  /**
   * @returns 表名
   */
  get tableName(): string
}

export abstract class Table<T> implements ITable {
  abstract get tableName(): string

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

