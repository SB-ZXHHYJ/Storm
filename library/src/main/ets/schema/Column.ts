import { ValueType } from '@kit.ArkData';

type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB' | 'REAL'

export interface IColumn<T extends ValueType> {
  /**
   * 绑定实体中的key
   */
  _key: string
  /**
   * 是否为主键
   */
  _isPrimaryKey: boolean
  /**
   * 修饰符
   */
  _columnModifier: string

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

export type TypeConverters<F extends ValueType, E> = {
  /**
   * 将对象转换为数据库支持的类型保存
   */
  save: (value: E) => F
  /**
   * 将从数据库中读出的数据转换回对象
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

export class Column<T extends ValueType, E> implements IColumn<T> {
  private constructor(
    readonly _fieldName: string,
    readonly _dataType: DataTypes,
    readonly _objectConstructor?: ObjectConstructor,
    readonly _typeConverters?: TypeConverters<T, E>
  ) {
  }

  readonly _isPrimaryKey: boolean = false

  readonly _columnModifier: string = `${this._fieldName} ${this._dataType}`

  readonly _key: string

  private readonly column = this as IColumn<T>

  primaryKey(autoincrement?: boolean): this {
    this.column._isPrimaryKey = true
    this.column._columnModifier += ' PRIMARY KEY'
    if (autoincrement) {
      this.column._columnModifier += ' AUTOINCREMENT'
    }
    return this
  }

  notNull(): this {
    this.column._columnModifier += ' NOT NULL';
    return this
  }

  unique(): this {
    this.column._columnModifier += ' UNIQUE';
    return this
  }

  default(value: T): this {
    this.column._columnModifier += ` DEFAULT '${value}'`;
    return this
  }

  /**
   * 创建`INTEGER`类型的列
   * @param fieldName 列名
   */
  static integer(fieldName: string): Column<number, number> {
    return new Column(fieldName, 'INTEGER')
  }

  /**
   * 创建`REAL`类型的列
   * @param fieldName 列名
   */
  static real(fieldName: string): Column<number, number> {
    return new Column(fieldName, 'REAL')
  }

  /**
   * 创建`TEXT`类型的列
   * @param fieldName 列名
   */
  static text(fieldName: string): Column<string, string> {
    return new Column(fieldName, 'TEXT')
  }

  /**
   * 创建`boolean`类型的列
   * @param fieldName 列名
   */
  static boolean(fieldName: string): Column<number, boolean> {
    return new Column(fieldName, 'INTEGER', undefined, BooleanTypeConverters)
  }

  /**
   * 创建`自定义类型`的列
   * @param fieldName 列名
   * @param converters 转换器
   */
  static json<T>(fieldName: string, converters: TypeConverters<string, T>): Column<string, T> {
    return new Column(fieldName, 'TEXT', undefined, converters)
  }

  /**
   * 创建`Date`类型的列
   * @param fieldName 列名
   */
  static date(fieldName: string): Column<string, Date> {
    return this.json(fieldName, DateTypeConverters)
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