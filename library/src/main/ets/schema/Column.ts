import { Check } from '../utils/Check';
import { Table } from './Table';
import { BooleanTypeConverters, DateTypeConverters, TimestampTypeConverters, TypeConverters } from './TypeConverters';

export type SupportValueTypes = null | number | string | boolean | Uint8Array

export type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB' | 'REAL'

export type SafeKeys<T, M> = {
  [K in keyof T]: T[K] extends M ? K : never
}[keyof T] & keyof T

export type SafeColumns<T extends Table<any>> = {
  [K in keyof T]: T[K] extends IColumn ? T[K] : never
}[keyof T]

export interface IColumn {
  /**
   * Column的名称
   */
  _fieldName: string
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
   * Column修饰符，即Column名称和Column类型的集合
   */
  _columnModifier: string
}

export class Column<V extends SupportValueTypes = SupportValueTypes, M = any> implements IColumn {
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

  private readonly that = this as IColumn

  /**
   * 使用PRIMARY KEY修饰Column
   * @param autoincrement 是否使用PRIMARY KEY AUTOINCREMENT修饰Column
   * @returns 返回当前实例
   */
  primaryKey(autoincrement?: boolean): this {
    this.that._isPrimaryKey = true
    this.that._columnModifier += ' PRIMARY KEY'
    if (autoincrement && this._dataType === 'INTEGER') {
      this.that._columnModifier += ' AUTOINCREMENT'
      this.that._isAutoincrement = true
    }
    return this
  }

  /**
   * 使用NOT NULL修饰Column
   * @returns 返回当前实例
   */
  notNull(): this {
    this.that._columnModifier += ' NOT NULL';
    return this
  }

  /**
   * 使用UNIQUE修饰Column
   * @returns 返回当前实例
   */
  unique(): this {
    this.that._columnModifier += ' UNIQUE';
    return this
  }

  /**
   * 设置Column的默认值
   * @param value 默认值
   * @returns 返回当前实例
   */
  default(value: V): this {
    this.that._columnModifier += ` DEFAULT '${value}'`;
    return this
  }

  /**
   * 将Column绑定到目标Table的实体模型中的指定属性
   * @param targetTable 目标Table
   * @param key 实体模型中的属性名称
   * @returns 返回当前实例
   */
  bindTo<T>(targetTable: Table<T>, key: SafeKeys<T, M>): IColumn {
    Check.checkColumnUniqueBindTo(this)
    this.that._key = key.toString()
    const tableAllColumns = targetTable.tableColumns as Column<SupportValueTypes, any>[]
    tableAllColumns.push(this)
    if (this._isPrimaryKey) {
      const tableIdColumns = targetTable.tableIdColumns as Column<SupportValueTypes, any>[]
      tableIdColumns.push(this)
    }
    return this
  }

  /**
   * 创建INTEGER类型的Column
   * @param fieldName Column的名称
   */
  static integer<M = number>(fieldName: string, typeConverters?: TypeConverters<number, M>): Column<number, M> {
    return new Column(fieldName, 'INTEGER', typeConverters)
  }

  /**
   * 创建REAL类型的Column
   * @param fieldName Column的名称
   */
  static real<M = number>(fieldName: string, typeConverters?: TypeConverters<number, M>): Column<number, M> {
    return new Column(fieldName, 'REAL', typeConverters)
  }

  /**
   * 创建TEXT类型的Column
   * @param fieldName Column的名称
   */
  static text<M = string>(fieldName: string, typeConverters?: TypeConverters<string, M>): Column<string, M> {
    return new Column(fieldName, 'TEXT', typeConverters)
  }

  /**
   * 创建Uint8Array类型的Column
   * @param fieldName Column的名称
   */
  static blob<M = Uint8Array>(
    fieldName: string,
    typeConverters?: TypeConverters<Uint8Array, M>
  ): Column<Uint8Array, M> {
    return new Column(fieldName, 'BLOB', typeConverters)
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
   * 创建TEXT类型的Column并通过DateTypeConverters将类型转换为Date
   * @see DateTypeConverters
   * @param fieldName Column的名称
   */
  static date(fieldName: string): Column<string, Date> {
    return this.text(fieldName, DateTypeConverters)
  }

  /**
   * 创建INTEGER类型的Column并通过TimestampTypeConverters将类型转换为Date
   * @see TimestampTypeConverters
   * @param fieldName Column的名称
   */
  static timestamp(fieldName: string): Column<number, Date> {
    return this.integer(fieldName, TimestampTypeConverters)
  }

  /**
   * 创建TEXT类型的列并通过自定义converters来进行类型转换
   * @param fieldName Column的名称
   * @param converters 转换器
   */
  static json<T>(fieldName: string, converters: TypeConverters<string, T>): Column<string, T> {
    return new Column(fieldName, 'TEXT', converters)
  }


  /**
   * 将Column绑定到参考Table中，相当于关系数据库中的外键，使用时需要确保参考Table和其实体都存在唯一主键
   * Storm会将参考Table中实体的主键存储到这个Column上，在查询时Storm会自动从参考Table中查询并填充到这个Column所绑定的实体属性上
   * @param fieldName Column的名称
   * @param referencesTable 参考的Table
   */
  static references<M>(fieldName: string, referencesTable: Table<M>): Column<number, M> {
    return new ReferencesColumn(fieldName, referencesTable)
  }

  /**
   * 创建索引构建器
   * @param indexName 索引名称
   * @param unique 是否为唯一索引
   */
  static index(indexName: string, ...indexes: IColumn[]): IndexColumn {
    return new IndexColumn(indexName, indexes)
  }
}

export class ReferencesColumn<T extends SupportValueTypes, E> extends Column<T, E> {
  constructor(
    readonly _fieldName: string,
    readonly _referencesTable: Table<E>
  ) {
    super(_fieldName, 'INTEGER', undefined)
  }
}

export interface IIndexColumn extends IColumn {
  /**
   * 索引包含的列名
   */
  _columns: readonly IColumn[]
  /**
   * 是否为唯一索引
   */
  _isUnique?: boolean
  /**
   * 索引顺序
   */
  _order?: 'ASC' | 'DESC'
}

/**
 * 索引构建器类
 */
class IndexColumn implements IIndexColumn {
  readonly _isUnique: boolean = false
  readonly _order?: 'ASC' | 'DESC'

  constructor(readonly _fieldName: string, readonly _columns: readonly IColumn[]) {
  }

  get _dataType(): DataTypes {
    throw new Error('IndexColumn does not support get _dataType')
  }

  get _key(): string {
    throw new Error('IndexColumn does not support get _key')
  }

  get _isPrimaryKey(): boolean {
    throw new Error('IndexColumn does not support get _isPrimaryKey')
  }

  get _isAutoincrement(): boolean {
    throw new Error('IndexColumn does not support get _isAutoincrement')
  }

  get _columnModifier(): string {
    throw new Error('IndexColumn does not support get _columnModifier')
  }

  private readonly that = this as IIndexColumn

  unique(unique: boolean = true): this {
    this.that._isUnique = unique
    return this
  }

  order(order: 'ASC' | 'DESC'): this {
    this.that._order = order
    return this
  }

  bindTo<T>(targetTable: Table<T>): IIndexColumn {
    if (this._columns.length === 0) {
      throw new Error('The index must contain at least one column.')
    }
    // 检查是否存在重复列
    const columnKeys = this._columns.map(it => it._key)
    if (new Set(columnKeys).size !== columnKeys.length) {
      throw new Error('Duplicate columns exist in the index.')
    }
    const tableIndies = targetTable.tableIndexColumns as IIndexColumn[]
    tableIndies.push(this)
    return this
  }
}