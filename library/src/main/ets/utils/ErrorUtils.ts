import { Table } from '../../../../Index';

export class ErrorUtils {
  private constructor() {
  }

  static IdColumnNotDefined(table: Table<any>) {
    throw new Error(`Table "${table.tableName}" 中可能没有描述primaryKey`);
  }

  static TableNotUnique() {
    throw new Error(`Table不能被多个@SqlTable()指向`);
  }
}