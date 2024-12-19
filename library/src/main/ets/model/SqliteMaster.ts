import { Column } from '../../../../Index';
import { Table } from '../schema/Table';

class SqliteMasterTable extends Table<SqliteMaster> {
  readonly tableName: string = 'sqlite_master'
  readonly type = Column.text('type').bindTo(this, 'type')
  readonly name = Column.text('name').bindTo(this, 'name')
  readonly tblName = Column.text('tbl_name').bindTo(this, 'tbl_name')
  readonly rootpage = Column.integer('type').bindTo(this, 'rootpage')
  readonly sql = Column.text('sql').bindTo(this, 'sql')
}

export const TableSqliteMaster = new SqliteMasterTable()

export interface SqliteMaster {
  type: string
  name: string
  tbl_name: string
  rootpage: number
  sql: string
}