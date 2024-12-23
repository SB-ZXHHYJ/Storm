import { Table, UseTableOptions } from './Table';
import { BooleanTypeConverters, DateTypeConverters, TimestampTypeConverters, TypeConverters } from './TypeConverters';

/**
 * Storm 支持存储的基本类型
 */
export type SupportValueTypes = null | number | string | Uint8Array

/**
 * 用于提取 Column 的泛型 Key
 */
export type ExtractColumnKey<T extends ColumnTypes> =
  T extends Column<any, infer M, any, any> ? M extends string ? M : never : never

/**
 * Column 的通用类型
 */
export type ColumnTypes = Column<any, any, any, any>

/**
 * IndexColumn 的通用类型
 */
export type IndexColumnTypes = IndexColumn

/**
 * 支持在 Sqlite 中声明的基本类型
 */
export type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB' | 'REAL'

/**
 * 用于为 bindTo 提供一定的 IDE 检查
 */
export type SafeKeys<T, M> = {
  [K in keyof T]: T[K] extends (M | undefined) ? K : never
}[keyof T] extends infer U ? U extends string ? U : never : never

export class Column<FieldName extends string, Key extends string, WriteType extends SupportValueTypes, ReadType> {
  protected constructor(
    readonly fieldName: FieldName,
    readonly dataType: DataTypes,
    readonly typeConverters: TypeConverters<WriteType, ReadType>
  ) {
  }

  private _isPrimaryKey = false

  private _isAutoincrement = false

  private _isNotNull = false

  private _isUnique = false

  private _defaultStr: string

  private _key: string

  get isPrimaryKey() {
    return this._isPrimaryKey
  }

  get isAutoincrement() {
    return this._isAutoincrement
  }

  get isNotNull() {
    return this._isNotNull
  }

  get isUnique() {
    return this._isUnique
  }

  get defaultStr() {
    return this._defaultStr
  }

  get key() {
    return this._key
  }

  /**
   * 使用 PRIMARY KEY 修饰列
   * @param autoincrement 是否是自增列
   * @returns this
   */
  primaryKey(autoincrement: boolean = false): Column<FieldName, Key, WriteType, ReadType> {
    this._isPrimaryKey = true
    if (autoincrement && this.dataType === 'INTEGER') {
      this._isAutoincrement = true
    } else {
      throw new Error('The autoincrement option can only be set for INTEGER data types.')
    }
    return this
  }

  /**
   * 使用 NOT NULL 修饰列
   * @returns this
   */
  notNull(): Column<FieldName, Key, WriteType, ReadType> {
    this._isNotNull = true
    return this
  }

  /**
   * 使用 UNIQUE 修饰列
   * @returns this
   */
  unique(): Column<FieldName, Key, WriteType, ReadType> {
    this._isUnique = true
    return this
  }

  /**
   * 设置列的默认值
   * @param value 默认值
   * @returns this
   */
  default(value: WriteType): Column<FieldName, Key, WriteType, ReadType> {
    this._defaultStr = value?.toString()
    return this
  }

  /**
   * 将列绑定到目标表中实体模型的指定属性
   * @param targetTable 目标表
   * @param key 实体中指定属性名
   * @returns this
   */
  bindTo<T, Key extends string & SafeKeys<T, ReadType>>(targetTable: Table<T>, key: Key) {
    this._key = key
    const useOptions = targetTable[UseTableOptions]()
    useOptions.addColumn(this)
    Object.freeze(this)
    return this as Column<FieldName, Key, WriteType, ReadType>
  }

  /**
   * 创建 INTEGER 类型的列
   * @param fieldName 列名
   * @returns Column 实例
   */
  static integer<FieldName extends string, WriteType extends number>(
    fieldName: FieldName,
    typeConverters?: TypeConverters<number, WriteType>) {
    return new Column(fieldName, 'INTEGER', typeConverters)
  }

  /**
   * 创建 REAL 类型的列
   * @param fieldName 列名
   * @returns Column 实例
   */
  static real<FieldName extends string, WriteType extends number>(fieldName: FieldName,
    typeConverters?: TypeConverters<number, WriteType>) {
    return new Column(fieldName, 'REAL', typeConverters)
  }

  /**
   * 创建 TEXT 类型的列
   * @param fieldName 列名
   * @returns Column 实例
   */
  static text<FieldName extends string, WriteType extends string>(fieldName: FieldName,
    typeConverters?: TypeConverters<string, WriteType>) {
    return new Column(fieldName, 'TEXT', typeConverters)
  }

  /**
   * 创建 Uint8Array 类型的列
   * @param fieldName 列名
   * @returns Column 实例
   */
  static blob<FieldName extends string>(fieldName: FieldName, typeConverters?: TypeConverters<Uint8Array, Uint8Array>) {
    return new Column(fieldName, 'BLOB', typeConverters)
  }

  /**
   * 创建 INTEGER 类型的列并通过 BooleanTypeConverters 将类型转换为 boolean
   * @see BooleanTypeConverters
   * @param fieldName 列名
   * @returns Column 实例
   */
  static boolean(fieldName: string) {
    return new Column(fieldName, 'INTEGER', BooleanTypeConverters)
  }

  /**
   * 创建 TEXT 类型的列并通过 DateTypeConverters 将类型转换为 Date
   * @see DateTypeConverters
   * @param fieldName 列名
   * @returns Column 实例
   */
  static date(fieldName: string) {
    return new Column(fieldName, 'TEXT', DateTypeConverters)
  }

  /**
   * 创建 INTEGER 类型的列并通过 TimestampTypeConverters 将类型转换为 Date
   * @see TimestampTypeConverters
   * @param fieldName 列名
   * @returns Column 实例
   */
  static timestamp(fieldName: string) {
    return new Column(fieldName, 'INTEGER', TimestampTypeConverters)
  }

  /**
   * 将列绑定到参考表中，相当于关系数据库中的外键，使用时需要确保参考表和其实体都存在唯一主键
   * Storm 会将参考表中实体的主键存储到这个列上，在查询时 Storm 会自动从参考表中查询并填充到这个列所绑定的实体属性上
   * @param fieldName 列名
   * @param referencesTable 参考的表
   * @returns ReferencesColumn 实例
   */
  static references<FieldName extends string, ReadType>(fieldName: FieldName, referencesTable: Table<ReadType>) {
    return new ReferencesColumn(fieldName, referencesTable)
  }

  /**
   * 创建索引列
   * @param fieldName 列名
   * @returns IndexColumn 实例
   */
  static index(fieldName: string): IndexColumn {
    return new IndexColumn(fieldName)
  }
}

export class ReferencesColumn<FieldName extends string, Key extends string, ReadType>
  extends Column<FieldName, Key, SupportValueTypes, ReadType> {
  constructor(
    readonly fieldName: FieldName,
    readonly referencesTable: Table<ReadType>
  ) {
    super(fieldName, 'INTEGER', null)
  }
}

/**
 * 索引的顺序
 */
type Order = 'ASC' | 'DESC'

export class IndexColumn {
  constructor(readonly fieldName: string) {
  }

  private readonly _columns: [ColumnTypes, Order | undefined][] = []

  private _isUnique = false

  get columns() {
    return this._columns
  }

  get isUnique() {
    return this._isUnique
  }

  /**
   * 使用 UNIQUE 修饰索引列
   * @returns this
   */
  unique(): this {
    this._isUnique = true
    return this
  }

  /**
   * 向索引中添加列
   *
   * @param column 要添加的列
   * @param order 列的排序
   * @returns this
   */
  column(column: ColumnTypes, order?: Order) {
    this._columns.push([column, order])
    return this
  }

  /**
   * 将索引列绑定到目标表中
   *
   * @param targetTable 目标表
   * @returns this
   * @throws 如果索引不包含任何列或存在重复列，则抛出错误。
   */
  bindTo<T>(targetTable: Table<T>) {
    if (this._columns.length === 0) {
      throw new Error('The index must contain at least one column.')
    }
    const columnFieldName = this._columns.map(([column]) => column.fieldName)
    if (new Set(columnFieldName).size !== columnFieldName.length) {
      throw new Error('Duplicate columns exist in the index.')
    }
    const useOptions = targetTable[UseTableOptions]()
    useOptions.addColumn(this)
    Object.freeze(this)
    return this
  }
}