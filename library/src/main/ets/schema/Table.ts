import { relationalStore, ValueType } from '@kit.ArkData';
import { getSqlColumn } from '../annotation/SqlColumn';
import { getSqlTable } from '../annotation/SqlTable';
import { LazyInitValue } from '../utils/ILazyInit';

export interface ICommon {
  _entityPrototype?: any
}

export abstract class Table<T> implements ICommon, Object {
  /**
   * 单纯用来避免编译器提示泛型T没有被使用
   */
  private declare readonly nothing: T

  /**
   * @returns 表名
   */
  abstract get tableName(): string

  /**
   * 这个表所绑定的实体的构造函数
   */
  readonly _entityPrototype?: ObjectConstructor

  readonly columnsLazy = new LazyInitValue<Column<any>[]>(() => {
    return Object.keys(this).map((item) => {
      return this[item]
    }).filter((item) => {
      return item instanceof Column
    })
  })

  readonly idColumnLazy = new LazyInitValue<Column<any>>(() => {
    return this.columnsLazy.value.find((item) => {
      return item._isPrimaryKey
    })
  })

  readonly modelMapValueBucket = (value: T) => {
    const valueBucket: relationalStore.ValuesBucket = {}
    for (const key of Object.keys(value)) {
      const currentValue = value[key]
      const column = getSqlColumn(this._entityPrototype.prototype, key)
      if (column) {
        if (column._entityPrototype) {
          const subTable = getSqlTable(column._entityPrototype)
          if (subTable) {
            const idColumn = subTable.idColumnLazy.value
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

type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB';

export class Column<E extends ValueType> implements ICommon {
  private constructor() {
    // 私有构造函数，防止外部直接实例化
  }

  /**
   * 实际的sql类型
   */
  _dataType: DataTypes;

  /**
   * 列名
   */
  _fieldName: string;

  /**
   * 是否主键
   */
  _isPrimaryKey?: boolean;

  /**
   * 是否自增
   */
  _isAutoincrement?: boolean;

  /**
   * 是否不可空
   */
  _isNotNull?: boolean;

  /**
   * 是否不可重复
   */
  _isUnique?: boolean;

  /**
   * 实体构造函数
   */
  readonly _entityPrototype?: ObjectConstructor;

  // getColumnBindTable():Table<any>|undefined{
  //   if (this._entityPrototype) {
  //     return getSqlTable(this._entityPrototype)
  //   }
  //   return undefined
  // }

  /**
   * 绑定实体绑定函数
   * 此函数用于将指定的值绑定到实体对象的特定字段上。
   * 调用此函数后，实体对象将新增一个属性，该属性的名称由Column的fieldName指定，值为传入的value参数。
   *
   * @param entity - 需要绑定属性的实体对象
   * @param value - 要绑定的值
   */
  _entityBindFunction?: (entity: any, value: any) => void;

  /**
   * 创建数值类型的列
   * @param fieldName 列名
   */
  static number(fieldName: string): Column<number> {
    const column = new Column();
    column._fieldName = fieldName;
    column._dataType = 'INTEGER';
    return column;
  }

  /**
   * 创建字符串类型的列
   * @param fieldName 列名
   */
  static string(fieldName: string): Column<string> {
    const column = new Column();
    column._fieldName = fieldName;
    column._dataType = 'TEXT';
    return column;
  }

  /**
   * 创建布尔类型的列
   * @param fieldName 列名
   */
  static boolean(fieldName: string): Column<boolean> {
    const column = new Column();
    column._fieldName = fieldName;
    column._dataType = 'TEXT';
    return column;
  }

  /**
   * 创建实体类型的列
   * @param name 在表中的名称
   * @param entityPrototype 实体的构造函数
   */
  static entity(name: string, entityPrototype: Function): Column<number> {
    const column = new Column();
    column._fieldName = name;
    column._dataType = 'INTEGER';
    const common = (column as ICommon);
    common._entityPrototype = entityPrototype;
    return column;
  }

  /**
   * 设置为主键
   * @param autoincrement 是否为自增列
   */
  primaryKey(autoincrement?: boolean): Column<E> {
    if (autoincrement && this._dataType != 'INTEGER') {
      throw TypeError('autoincrement only support dataType as INTEGER');
    }
    this._isPrimaryKey = true;
    this._isAutoincrement = autoincrement;
    return this;
  }

  /**
   * 设置为不可为空
   */
  notNull(): Column<E> {
    this._isNotNull = true;
    return this;
  }

  /**
   * 设置唯一约束
   */
  unique(): Column<E> {
    this._isUnique = true;
    return this;
  }
}