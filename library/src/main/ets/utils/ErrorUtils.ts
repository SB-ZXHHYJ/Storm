import { Table } from '../../../../Index';

export class ErrorUtils {
  private constructor() {
  }

  static IdColumnNotDefined(table: Table<any>) {
    throw new Error(`Table "${table.tableName}" 不存在primaryKey`);
  }

  static TableNotUnique() {
    throw new Error(`Table不能有多个实体类`);
  }

  static SqlColumnNotUnique() {
    throw new Error(`每一个属性最多只能被一个@SqlColumn()修饰`);
  }
}