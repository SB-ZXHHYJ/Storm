import { Check } from '../utils/Check';
import { Table } from './Table';

export type SupportValueType = null | number | string | boolean | Uint8Array

type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB' | 'REAL'

type SafeTypes<T, M> = {
  [K in keyof T]: T[K] extends M ? K : never
}[keyof T] & keyof T

export interface IValueColumn {
  /**
   * Column的名称
   */
  _fieldName: string,

  /**
   * Column的类型
   */
  _dataType: DataTypes
  /**
   * 实体中对应的属性名称
   */
  _key: string
  /**
   * 是否为主键
   */
  _isPrimaryKey: boolean
  /**
   * 是否自增
   */
  _isAutoincrement: boolean
  /**
   * Column修饰符
   */
  _columnModifier: string
}

export interface IFunctionColumn<V, M> {
  /**
   * 使用PRIMARY KEY修饰Column
   * @param autoincrement - 是否使用PRIMARY KEY AUTOINCREMENT修饰Column
   * @returns 返回当前实例
   */
  primaryKey(autoincrement?: boolean): IFunctionColumn<V, M>

  /**
   * 使用NOT NULL修饰Column
   * @returns 返回当前实例
   */
  notNull(): IFunctionColumn<V, M>

  /**
   * 使用UNIQUE修饰Column
   * @returns 返回当前实例
   */
  unique(): IFunctionColumn<V, M>

  /**
   * 设置Column的默认值
   * @param value - 默认值
   * @returns 返回当前实例
   */
  default(value: V): IFunctionColumn<V, M>

  /**
   * 将Column绑定到目标Table的实体模型中的指定属性
   * @param targetTable - 目标Table
   * @param key - 实体模型中的属性名称
   * @returns 返回当前实例
   */
  bindTo<T>(targetTable: Table<T>, key: SafeTypes<T, M>): IValueColumn
}

export type TypeConverters<F extends SupportValueType, E> = {
  /**
   * 将实体转换为数据库支持的类型保存
   */
  save: (value: E | null) => F | null
  /**
   * 将从数据库中读出的数据转换回实体
   */
  restore: (value: F | null) => E | null
}

/**
 * 内置的布尔类型转换器
 */
const BooleanTypeConverters: TypeConverters<number, boolean> = {
  save: value => {
    return (value === true ? 1 : value === false ? 0 : null)
  },
  restore: value => {
    return (value === 1 ? true : value === 0 ? false : null)
  }
}

/**
 * 内置的Date类型转换器
 */
const DateTypeConverters: TypeConverters<string, Date> = {
  save: value => {
    return value ? value.toString() : null
  },
  restore: value => {
    return value ? new Date(value) : null
  }
}

export class Column<V extends SupportValueType, M> implements IValueColumn, IFunctionColumn<V, M> {
  protected constructor(
    readonly _fieldName: string,
    readonly _dataType: DataTypes,
    readonly _typeConverters?: TypeConverters<V, M>
  ) {
  }

  readonly _isPrimaryKey: boolean = false

  readonly _isAutoincrement: boolean = false

  readonly _columnModifier: string = `${this._fieldName} ${this._dataType}`

  readonly _key: string

  private readonly valueColumn = this as IValueColumn

  primaryKey(autoincrement?: boolean): this {
    this.valueColumn._isPrimaryKey = true
    this.valueColumn._columnModifier += ' PRIMARY KEY'
    if (autoincrement && this._dataType === 'INTEGER') {
      this.valueColumn._columnModifier += ' AUTOINCREMENT'
      this.valueColumn._isAutoincrement = true
    }
    return this
  }

  notNull(): this {
    this.valueColumn._columnModifier += ' NOT NULL';
    return this
  }

  unique(): this {
    this.valueColumn._columnModifier += ' UNIQUE';
    return this
  }

  default(value: V): this {
    this.valueColumn._columnModifier += ` DEFAULT '${value}'`;
    return this
  }

  bindTo<T>(targetTable: Table<T>, key: SafeTypes<T, M>): IValueColumn {
    Check.checkColumnUniqueBindTo(this)
    this.valueColumn._key = key.toString()
    const tableAllColumns = targetTable.tableAllColumns as Column<SupportValueType, any>[]
    tableAllColumns.push(this)
    if (this._isPrimaryKey) {
      const tableIdColumns = targetTable.tableIdColumns as Column<SupportValueType, any>[]
      tableIdColumns.push(this)
    }
    return this
  }

  /**
   * 创建INTEGER类型的Column
   * @param fieldName  Column的名称
   */
  static integer(fieldName: string): Column<number, number> {
    return new Column(fieldName, 'INTEGER')
  }

  /**
   * 创建REAL类型的Column
   * @param fieldName  Column的名称
   */
  static real(fieldName: string): Column<number, number> {
    return new Column(fieldName, 'REAL')
  }

  /**
   * 创建TEXT类型的Column
   * @param fieldName  Column的名称
   */
  static text(fieldName: string): Column<string, string> {
    return new Column(fieldName, 'TEXT')
  }

  /**
   * 创建INTEGER类型的Column并通过BooleanTypeConverters将类型转换为boolean
   * @see BooleanTypeConverters
   * @param fieldName Column的名称
   */
  static boolean(fieldName: string): Column<number, boolean> {
    return new Column(fieldName, 'INTEGER', BooleanTypeConverters)
  }

  /**
   * 创建TEXT类型的列并通过自定义converters来进行类型转换
   * @param fieldName  Column的名称
   * @param converters 转换器
   */
  static json<T>(fieldName: string, converters: TypeConverters<string, T>): Column<string, T> {
    return new Column(fieldName, 'TEXT', converters)
  }

  /**
   * 创建TEXT类型的Column并通过DateTypeConverters将类型转换为Date
   * @see DateTypeConverters
   * @param fieldName  Column的名称
   */
  static date(fieldName: string): Column<string, Date> {
    return this.json(fieldName, DateTypeConverters)
  }

  /**
   * 创建Uint8Array类型的Column
   * @param fieldName  Column的名称
   */
  static blob(fieldName: string): Column<Uint8Array, Uint8Array> {
    return new Column(fieldName, 'BLOB')
  }

  /**
   * 将Column绑定到参考Table中，相当于关系数据库中的外键
   * Storm会将参考Table中实体的主键存储到这个Column上，在查询时Storm会自动从参考Table中查询并填充到这个Column所绑定的实体属性上
   * @todo 使用时需要确保参考Table和其实体都存在唯一主键
   * @param fieldName  Column的名称
   * @param referencesTable 参考的Table
   */
  static references<M>(fieldName: string, referencesTable: Table<M>): Column<number, M> {
    return new ReferencesColumn(fieldName, referencesTable)
  }
}

export class ReferencesColumn<T extends SupportValueType, E> extends Column<T, E> {
  constructor(
    readonly _fieldName: string,
    readonly _referencesTable: Table<E>
  ) {
    super(_fieldName, 'INTEGER', undefined)
  }
}