import { ValueType } from '@kit.ArkData';
import { getSqlTable } from '../annotation/SqlTable';
import { Table } from './Table';

type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB'

export interface PColumn<T extends ValueType> {
  _entityBindFunction?: (entity: any, value: any) => void
  /**
   * 绑定实体中的key
   */
  _key: string
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
}

interface IColumn<T extends ValueType> {
  /**
   * 设置当前列为主键
   * @param autoincrement - 指定此列是否为自增列，默认为 false
   * @returns 返回当前实例
   */
  primaryKey(autoincrement?: boolean): this;

  /**
   * 设置当前列为不可为空
   * @returns 返回当前实例
   */
  notNull(): this;

  /**
   * 设置当前列为唯一列，确保值不可重复
   * @returns 返回当前实例
   */
  unique(): this;

  /**
   * 设置当前列的默认值
   * @param value - 指定列的默认值
   * @returns 返回当前实例
   */
  default(value: T): this;
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

export class Column<T extends ValueType, E> implements IColumn<T>, PColumn<T> {
  private constructor(
    readonly _fieldName: string,
    readonly _dataType: DataTypes,
    readonly _objectConstructor?: ObjectConstructor,
    readonly _typeConverters?: TypeConverters<T, E>
  ) {
  }

  _getColumnBindTable(): Table<any> {
    return getSqlTable(this._objectConstructor)
  }

  readonly _key: string

  readonly _isPrimaryKey?: boolean

  readonly _isAutoincrement?: boolean

  readonly _isNotNull?: boolean

  readonly _isUnique?: boolean

  readonly _defaultValue?: T

  private readonly column = this as PColumn<T>

  primaryKey(autoincrement?: boolean): this {
    if (autoincrement && this._dataType != 'INTEGER') {
      throw TypeError('autoincrement only support dataType as INTEGER')
    }
    this.column._isPrimaryKey = true
    this.column._isAutoincrement = autoincrement
    return this
  }

  notNull(): this {
    this.column._isNotNull = true
    return this
  }

  unique(): this {
    this.column._isUnique = true
    return this
  }

  default(value: T): this {
    this.column._defaultValue = value
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