import { relationalStore, ValueType } from '@kit.ArkData'
import { getSqlColumn } from '../annotation/SqlColumn'
import { getSqlTable } from '../annotation/SqlTable'
import { ErrorUtils } from '../utils/ErrorUtils'
import { LazyInitValue } from '../utils/LazyInitValue'

export interface ICommon {
  /**
   * 实体的构造函数
   */
  _objectConstructor?: ObjectConstructor
}

interface ITable {
  /**
   * @returns 表名
   */
  get tableName(): string

}

export abstract class Table<T> implements ITable, ICommon {
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
      const column = getSqlColumn(this._objectConstructor.prototype, key)
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

type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB'

interface IColumn<T extends ValueType> {
  /**
   * 设置为主键
   * @param autoincrement 是否为自增列
   */
  primaryKey(autoincrement?: boolean): this

  /**
   * 设置为不可为空
   */
  notNull(): this

  /**
   * 设置不可重复
   */
  unique(): this

  default(value: T): this
}

export declare class TypeConverters<F extends ValueType, E> {
  /**
   * 将对象转换为数据库支持的类型保存
   */
  save: (value: E) => F
  /**
   * 将从数据库中读出的数据转换回对象
   */
  restore: (value: F) => E
}

export class Column<T extends ValueType, E> implements IColumn<T>, ICommon {
  /**
   * 单纯用来避免编译器提示泛型T没有被使用
   */
  private declare readonly nothing: T

  private constructor(readonly  _fieldName: string, readonly _dataType: DataTypes,
    readonly _objectConstructor?: ObjectConstructor, readonly  _typeConverters?: TypeConverters<T, E>) {
  }

  _getColumnBindTable(): Table<any> {
    return getSqlTable(this._objectConstructor)
  }

  /**
   * 绑定实体绑定函数
   * 此函数用于将指定的值绑定到实体对象的特定字段上。
   * 调用此函数后，实体对象将新增一个属性，该属性的名称由Column的fieldName指定，值为传入的value参数。
   *
   * @param entity - 需要绑定属性的实体对象
   * @param value - 要绑定的值
   */
  _entityBindFunction?: (entity: any, value: any) => void

  /**
   * 是否主键
   */
  _isPrimaryKey?: boolean

  /**
   * 是否自增
   */
  _isAutoincrement?: boolean

  /**
   * 是否不可空
   */
  _isNotNull?: boolean

  /**
   * 是否不可重复
   */
  _isUnique?: boolean

  /**
   * 默认值
   */
  _defaultValue?: T

  primaryKey(autoincrement?: boolean): this {
    if (autoincrement && this._dataType != 'INTEGER') {
      throw TypeError('autoincrement only support dataType as INTEGER')
    }
    this._isPrimaryKey = true
    this._isAutoincrement = autoincrement
    return this
  }

  notNull(): this {
    this._isNotNull = true
    return this
  }

  unique(): this {
    this._isUnique = true
    return this
  }

  default(value: T): this {
    this._defaultValue = value
    return this
  }

  /**
   * 创建数值类型的列
   * @param fieldName 列名
   */
  static number(fieldName: string): Column<number, number> {
    return new Column(fieldName, 'INTEGER')
  }

  /**
   * 创建字符串类型的列
   * @param fieldName 列名
   */
  static string(fieldName: string): Column<string, string> {
    return new Column(fieldName, 'TEXT')
  }

  /**
   * 创建布尔类型的列
   * @param fieldName 列名
   */
  static boolean(fieldName: string): Column<boolean, boolean> {
    return new Column(fieldName, 'TEXT')
  }

  /**
   * 创建自定义类型的列
   * @param fieldName 列名
   * @param converters 转换器
   */
  static json<T>(fieldName: string, converters: TypeConverters<string, T>): Column<string, T> {
    return new Column(fieldName, 'TEXT', undefined, converters)
  }

  /**
   * 创建Date类型的列
   * @param fieldName 列名
   */
  static date(fieldName: string): Column<string, Date> {
    return this.json(fieldName, {
      save: value => {
        return value.toString()
      },
      restore: value => {
        return new Date(value)
      }
    })
  }

  /**
   * 创建实体类型的列
   * @param fieldName 列名
   * @param objectConstructor 实体的构造函数
   */
  static entity<T>(fieldName: string, objectConstructor: T): Column<number, T> {
    return new Column(fieldName, 'INTEGER', objectConstructor as ObjectConstructor)
  }
}