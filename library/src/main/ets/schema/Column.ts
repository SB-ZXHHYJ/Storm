import { Check } from '../utils/Check';
import { Table } from './Table';
import { BooleanTypeConverters, DateTypeConverters, TimestampTypeConverters, TypeConverters } from './TypeConverters';

/**
 * Storm 支持存储的基本类型
 */
export type SupportValueTypes = null | number | string | boolean | Uint8Array

/**
 * 用于获取 Column 的 Key
 */
export type ColumnKey<T
extends ColumnTypes> = T extends Column<any, infer M, any, any> ? M extends string ? M : never : never

/**
 * Column 的类型
 */
export type ColumnTypes = Column<any, any, any, any>

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

  private _columnModifier = `${this.fieldName} ${this.dataType}`

  private _key: Key

  get isPrimaryKey() {
    return this._isPrimaryKey
  }

  get isAutoincrement() {
    return this._isAutoincrement
  }

  get columnModifier() {
    return this._columnModifier
  }

  get key() {
    return this._key
  }

  /**
   * 使用 PRIMARY KEY 修饰 Column
   * @param autoincrement 是否是 AUTOINCREMENT Column
   * @returns {this}
   */
  primaryKey(autoincrement: boolean = false): this {
    this._isPrimaryKey = true
    this._columnModifier += ' PRIMARY KEY'
    if (autoincrement && this.dataType === 'INTEGER') {
      this._columnModifier += ' AUTOINCREMENT'
      this._isAutoincrement = true
    } else {
      throw new Error('The autoincrement option can only be set for INTEGER data types.')
    }
    return this
  }

  /**
   * 使用NOT NULL修饰Column
   * @returns {this}
   */
  notNull(): this {
    this._columnModifier += ' NOT NULL';
    return this
  }

  /**
   * 使用UNIQUE修饰Column
   * @returns {this}
   */
  unique(): this {
    this._columnModifier += ' UNIQUE';
    return this
  }

  /**
   * 设置Column的默认值
   * @param value 默认值
   * @returns {this}
   */
  default(value: WriteType): this {
    this._columnModifier += ` DEFAULT '${value}'`;
    return this
  }

  /**
   * 将Column绑定到目标Table的实体模型中的指定属性
   * @param targetTable 目标Table
   * @param key 实体模型中的属性名称
   * @returns {this}
   */
  bindTo<T, Key extends SafeKeys<T, ReadType>>(targetTable: Table<T>, key: Key) {
    Check.checkColumnUniqueBindTo(this)
    this._key = key
    const tableAllColumns = targetTable.tableColumns as ColumnTypes[]
    tableAllColumns.push(this)
    if (this.isPrimaryKey) {
      const tableIdColumns = targetTable.tableIdColumns as ColumnTypes[]
      tableIdColumns.push(this)
    }
    return this as Column<FieldName, Key, WriteType, ReadType>
  }

  /**
   * 创建INTEGER类型的Column
   * @param fieldName Column的名称
   */
  static integer<FieldName extends string, WriteType extends number>(
    fieldName: FieldName,
    typeConverters?: TypeConverters<number, WriteType>) {
    return new Column(fieldName, 'INTEGER', typeConverters)
  }

  /**
   * 创建REAL类型的Column
   * @param fieldName Column的名称
   */
  static real<FieldName extends string, WriteType extends number>(fieldName: FieldName,
    typeConverters?: TypeConverters<number, WriteType>) {
    return new Column(fieldName, 'REAL', typeConverters)
  }

  /**
   * 创建TEXT类型的Column
   * @param fieldName Column的名称
   */
  static text<FieldName extends string, WriteType extends string>(fieldName: FieldName,
    typeConverters?: TypeConverters<string, WriteType>) {
    return new Column(fieldName, 'TEXT', typeConverters)
  }

  /**
   * 创建Uint8Array类型的Column
   * @param fieldName Column的名称
   */
  static blob<FieldName extends string>(fieldName: FieldName, typeConverters?: TypeConverters<Uint8Array, Uint8Array>) {
    return new Column(fieldName, 'BLOB', typeConverters)
  }

  /**
   * 创建INTEGER类型的Column并通过BooleanTypeConverters将类型转换为boolean
   * @see BooleanTypeConverters
   * @param fieldName Column的名称
   */
  static boolean(fieldName: string) {
    return new Column(fieldName, 'INTEGER', BooleanTypeConverters)
  }

  /**
   * 创建TEXT类型的Column并通过DateTypeConverters将类型转换为Date
   * @see DateTypeConverters
   * @param fieldName Column的名称
   */
  static date(fieldName: string) {
    return new Column(fieldName, 'TEXT', DateTypeConverters)
  }

  /**
   * 创建INTEGER类型的Column并通过TimestampTypeConverters将类型转换为Date
   * @see TimestampTypeConverters
   * @param fieldName Column的名称
   */
  static timestamp(fieldName: string) {
    return new Column(fieldName, 'INTEGER', TimestampTypeConverters)
  }

  /**
   * 将Column绑定到参考Table中，相当于关系数据库中的外键，使用时需要确保参考Table和其实体都存在唯一主键
   * Storm会将参考Table中实体的主键存储到这个Column上，在查询时Storm会自动从参考Table中查询并填充到这个Column所绑定的实体属性上
   * @param fieldName Column的名称
   * @param referencesTable 参考的Table
   */
  static references<FieldName extends string, ReadType>(fieldName: FieldName, referencesTable: Table<ReadType>) {
    return new ReferencesColumn(fieldName, referencesTable)
  }

  /**
   * 创建索引构建器
   * @param indexName 索引名称
   * @param unique 是否为唯一索引
   */
  static index(indexName: string): IndexColumn {
    return new IndexColumn(indexName)
  }
}

export class ReferencesColumn<FieldName extends string, Key extends string, ReadType> extends Column<FieldName, Key, SupportValueTypes, ReadType> {
  constructor(
    readonly fieldName: FieldName,
    readonly referencesTable: Table<ReadType>
  ) {
    super(fieldName, 'INTEGER', undefined)
  }
}

type Order = 'ASC' | 'DESC'

export class IndexColumn {
  constructor(readonly fieldName: string) {
  }

  private _columns: ColumnTypes[] = []

  private _isUnique = false

  private _sortOrder: Order

  get columns() {
    return this._columns
  }

  get isUnique() {
    return this._isUnique
  }

  get sortOrder() {
    return this._sortOrder
  }

  unique(unique: boolean = true): this {
    this._isUnique = unique
    return this
  }

  order(order: Order): this {
    this._sortOrder = order
    return this
  }

  bindTo<T>(targetTable: Table<T>, ...columns: ColumnTypes[]) {
    if (columns.length === 0) {
      throw new Error('The index must contain at least one column.')
    }
    const columnFieldName = columns.map(it => it.fieldName)
    if (new Set(columnFieldName).size !== columnFieldName.length) {
      throw new Error('Duplicate columns exist in the index.')
    }
    this._columns = columns
    const tableIndies = targetTable.tableIndexColumns as IndexColumn[]
    tableIndies.push(this)
    return this
  }
}