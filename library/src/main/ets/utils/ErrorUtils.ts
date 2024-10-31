import { Table } from '../../../../Index';

export class ErrorUtils {
  private constructor() {
  }

  static IdColumnNotDefined(table: Table<any>) {
    throw new Error(`TableName:"${table.tableName}"中可能没有描述primaryKey`);
  }
}