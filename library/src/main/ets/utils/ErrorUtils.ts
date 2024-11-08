import { Table } from '../../../../Index';

export class ErrorUtils {
  private constructor() {
  }

  static IdColumnNotDefined(table: Table<any>) {
    //不存在主键
    throw new Error(`Table "${table.tableName}" does not have a primary key.`);
  }

  static AtSqlTableNotUnique() {
    //Table不能被多个实体类绑定
    throw new Error(`A table cannot have multiple entity classes.`);
  }

  static AtSqlColumnNotUnique() {
    //每一个属性最多只能被一个@SqlColumn()修
    throw new Error(`Each property can only be decorated with one @SqlColumn().`);
  }
}