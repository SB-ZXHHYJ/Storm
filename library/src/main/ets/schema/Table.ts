import { ValueType } from '@kit.ArkData';

export interface ICommon {
  entityPrototype?: any
}

export abstract class Table<T> implements ICommon, Object {
  /**
   * 用来避免编译器提示泛型T没有被使用
   */
  declare readonly entity: T

  /**
   * @returns 表名
   */
  abstract get tableName(): string

  /**
   * 这个表所绑定的实体的构造函数
   */
  readonly entityPrototype?: ObjectConstructor
}

type DataTypes = 'INTEGER' | 'TEXT' | 'BLOB';

export class Column<E extends ValueType> implements ICommon {
  private constructor() {
    // 私有构造函数，防止外部直接实例化
  }

  /**
   * 实际的sql类型
   */
  dataType: DataTypes;

  /**
   * 列名
   */
  fieldName: string;

  /**
   * 是否主键
   */
  isPrimaryKey?: boolean;

  /**
   * 是否自增
   */
  isAutoincrement?: boolean;

  /**
   * 是否不可空
   */
  isNotNull?: boolean;

  /**
   * 是否不可重复
   */
  isUnique?: boolean;

  /**
   * 实体构造函数
   */
  readonly entityPrototype?: ObjectConstructor;

  /**
   * 绑定实体绑定函数
   * 此函数用于将指定的值绑定到实体对象的特定字段上。
   * 调用此函数后，实体对象将新增一个属性，该属性的名称由Column的fieldName指定，值为传入的value参数。
   *
   * @param entity - 需要绑定属性的实体对象
   * @param value - 要绑定的值
   */
  entityBindFunction?: (entity: any, value: any) => void;

  /**
   * 创建数值类型的列
   * @param name 在表中的名称
   */
  static number(name: string): Column<number> {
    const column = new Column();
    column.fieldName = name;
    column.dataType = 'INTEGER';
    return column;
  }

  /**
   * 创建字符串类型的列
   * @param name 在表中的名称
   */
  static string(name: string): Column<string> {
    const column = new Column();
    column.fieldName = name;
    column.dataType = 'TEXT';
    return column;
  }

  /**
   * 创建布尔类型的列
   * @param name 在表中的名称
   */
  static boolean(name: string): Column<boolean> {
    const column = new Column();
    column.fieldName = name;
    column.dataType = 'TEXT';
    return column;
  }

  /**
   * 创建实体类型的列
   * @param name 在表中的名称
   * @param entityPrototype 实体的构造函数
   */
  static entity(name: string, entityPrototype: Function): Column<number> {
    const column = new Column();
    column.fieldName = name;
    column.dataType = 'INTEGER';
    const common = (column as ICommon);
    common.entityPrototype = entityPrototype;
    return column;
  }

  /**
   * 设置为主键
   * @param autoincrement 是否为自增列
   */
  id(autoincrement?: boolean): Column<E> {
    if (autoincrement && this.dataType != 'INTEGER') {
      throw TypeError('autoincrement only support dataType as INTEGER');
    }
    this.isPrimaryKey = true;
    this.isAutoincrement = autoincrement;
    return this;
  }

  /**
   * 设置为不可为空
   */
  notNull(): Column<E> {
    this.isNotNull = true;
    return this;
  }

  /**
   * 设置唯一约束
   */
  unique(): Column<E> {
    this.isUnique = true;
    return this;
  }
}