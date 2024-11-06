import { relationalStore, ValueType } from '@kit.ArkData'
import { getSqlColumn } from '../annotation/SqlColumn'
import { getSqlTable } from '../annotation/SqlTable'
import { LazyInitValue } from '../utils/ILazyInit'

export interface ICommon {
  _entityPrototype?: ObjectConstructor
}

interface ITable {
  /**
   * @returns 表名
   */
  get tableName(): string
}

export abstract class Table<T> implements ITable, ICommon {
  abstract get tableName(): string

  /**
   * 这个表所绑定的实体的构造函数
   */
  readonly _entityPrototype?: ObjectConstructor

  readonly _columnsLazy = new LazyInitValue<Column<any>[]>(() => {
    return Object.keys(this).map((item) => {
      return this[item]
    }).filter((item) => {
      return item instanceof Column
    })
  })

  readonly _idColumnLazy = new LazyInitValue<Column<any>>(() => {
    return this._columnsLazy.value.find((item) => {
      return item._isPrimaryKey
    })
  })

  readonly _modelMapValueBucket = (value: T) => {
    const valueBucket: relationalStore.ValuesBucket = {}
    for (const key of Object.keys(value)) {
      const currentValue = value[key]
      const column = getSqlColumn(this._entityPrototype.prototype, key)
      if (column && currentValue) {
        if (column._entityPrototype) {
          const subTable = getSqlTable(column._entityPrototype)
          if (subTable) {
            const idColumn = subTable._idColumnLazy.value
            if (idColumn) {
              // 从插入的数据里获取id
              valueBucket[column._fieldName] = currentValue[idColumn._fieldName]
              continue
            }
          }
        }
        valueBucket[column._fieldName] = currentValue
      }
    }
    return valueBucket
  }
}

type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB'

interface IColumn {
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
}

export class Column<V extends ValueType> implements IColumn, ICommon {
  /**
   * 单纯用来避免编译器提示泛型T没有被使用
   */
  private declare readonly nothing: V

  constructor(readonly  _fieldName: string, readonly _dataType: DataTypes,
    readonly _entityPrototype?: ObjectConstructor) {
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

  /**
   * 创建数值类型的列
   * @param fieldName 列名
   */
  static number(fieldName: string): Column<number> {
    return new Column(fieldName, 'INTEGER')
  }

  /**
   * 创建字符串类型的列
   * @param fieldName 列名
   */
  static string(fieldName: string): Column<string> {
    return new Column(fieldName, 'TEXT')
  }

  /**
   * 创建布尔类型的列
   * @param fieldName 列名
   */
  static boolean(fieldName: string): Column<boolean> {
    return new Column(fieldName, 'TEXT')
  }

  /**
   * 创建实体类型的列
   * @param fieldName 列名
   * @param entityPrototype 实体的构造函数
   */
  static entity(fieldName: string, entityPrototype: Function): Column<number> {
    return new Column(fieldName, 'INTEGER', entityPrototype as ObjectConstructor)
  }
}