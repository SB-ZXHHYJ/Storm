import { ValueType } from '@kit.ArkData';
import { Check } from '../utils/Check';
import { ITable, Table } from './Table';

type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB' | 'REAL'

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

export interface IFunctionColumn<V extends ValueType> {
  /**
   * 使用PRIMARY KEY修饰Column
   * @param autoincrement - 是否使用PRIMARY KEY AUTOINCREMENT修饰Column
   * @returns 返回当前实例
   */
  primaryKey(autoincrement?: boolean): IFunctionColumn<V>

  /**
   * 使用NOT NULL修饰Column
   * @returns 返回当前实例
   */
  notNull(): IFunctionColumn<V>

  /**
   * 使用UNIQUE修饰Column
   * @returns 返回当前实例
   */
  unique(): IFunctionColumn<V>

  /**
   * 设置Column的默认值
   * @param value - 默认值
   * @returns 返回当前实例
   */
  default(value: V): IFunctionColumn<V>

  /**
   * 将Column绑定到目标Table的实体模型中的指定属性
   * @param targetTable - 目标Table
   * @param key - 实体模型中的属性名称
   * @returns 返回当前实例
   */
  bindTo<M>(targetTable: Table<M>, key: keyof M): IValueColumn
}

export type TypeConverters<F extends ValueType, E> = {
  /**
   * 将实体转换为数据库支持的类型保存
   */
  save: (value: E) => F
  /**
   * 将从数据库中读出的数据转换回实体
   */
  restore: (value: F) => E
}

/**
 * 内置的布尔类型转换器
 */
const BooleanTypeConverters: TypeConverters<number, boolean> = {
  save: value => {
    return value ? 1 : 0
  },
  restore: value => {
    return value === 0 ? false : true
  }
}

/**
 * 内置的Date类型转换器
 */
const DateTypeConverters: TypeConverters<string, Date> = {
  save: value => {
    return value.toString()
  },
  restore: value => {
    return new Date(value)
  }
}

export class Column<V extends ValueType, M> implements IValueColumn, IFunctionColumn<V> {
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

  bindTo<M>(targetTable: Table<M>, key: keyof M): IValueColumn {
    Check.checkColumnUniqueBindTo(this)
    this.valueColumn._key = key.toString()
    const varTable = targetTable as ITable
    varTable._tableAllColumns.push(this)
    if (this._isPrimaryKey) {
      varTable._tableIdColumns.push(this)
    }
    return this
  }

  /**
   * 创建INTEGER类型的列
   * @param fieldName 列名
   */
  static integer(fieldName: string): Column<number, number> {
    return new Column(fieldName, 'INTEGER')
  }

  /**
   * 创建REAL类型的列
   * @param fieldName 列名
   */
  static real(fieldName: string): Column<number, number> {
    return new Column(fieldName, 'REAL')
  }

  /**
   * 创建TEXT类型的列
   * @param fieldName 列名
   */
  static text(fieldName: string): Column<string, string> {
    return new Column(fieldName, 'TEXT')
  }

  /**
   * 创建boolean类型的列
   * @param fieldName 列名
   */
  static boolean(fieldName: string): Column<number, boolean> {
    return new Column(fieldName, 'INTEGER', BooleanTypeConverters)
  }

  /**
   * 创建自定义类型的列
   * @param fieldName 列名
   * @param converters 转换器
   */
  static json<T>(fieldName: string, converters: TypeConverters<string, T>): Column<string, T> {
    return new Column(fieldName, 'TEXT', converters)
  }

  /**
   * 创建Date类型的列
   * @param fieldName 列名
   */
  static date(fieldName: string): Column<string, Date> {
    return this.json(fieldName, DateTypeConverters)
  }

  /**
   * 将Column绑定到参考Table中，相当于关系数据库中的外键
   * Storm会将参考Table中实体的主键存储到这个Column上，在查询时Storm会自动从参考Table中查询并填充到这个Column所绑定的实体属性上
   * @todo 使用时需要确保参考Table和其实体都存在主键
   * @param fieldName 列名
   * @param referencesTable 参考的Table
   * @returns
   */
  static references<M>(fieldName: string, referencesTable: Table<M>): Column<number, M> {
    return new ReferencesColumn(fieldName, referencesTable)
  }
}

export class ReferencesColumn<T extends ValueType, E> extends Column<T, E> {
  constructor(
    readonly _fieldName: string,
    readonly _referencesTable: Table<E>
  ) {
    super(_fieldName, 'INTEGER', undefined)
  }
}