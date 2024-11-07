import { Column } from '../schema/Column';
import { Table } from '../schema/Table';

export class SqlUtils {
  private constructor() {
  }

  static getTableCreateSql(targetTable: Table<any>) {
    const tableArgs = Object.keys(targetTable)
      .map(key => {
        const column = targetTable[key];
        if (column instanceof Column) {
          let definition = `${column._fieldName} ${column._dataType}`;
          if (column._isNotNull) {
            definition += ' NOT NULL';
          }
          if (column._isUnique) {
            definition += ' UNIQUE';
          }
          if (column._isPrimaryKey) {
            definition += ' PRIMARY KEY';
          }
          if (column._isAutoincrement) {
            definition += ' AUTOINCREMENT';
          }
          if (column._defaultValue !== undefined) {
            definition += ` DEFAULT '${column._defaultValue}'`;
          }

          return definition;
        }
      })
      .filter(Boolean)
      .join(', ');

    // 返回创建表的 SQL 语句
    return `CREATE TABLE IF NOT EXISTS ${targetTable.tableName} (${tableArgs})`;
  }
}