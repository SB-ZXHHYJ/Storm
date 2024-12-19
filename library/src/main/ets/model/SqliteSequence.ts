import { Column } from '../schema/Column'
import { Table } from '../schema/Table'
import { Storm } from '../storm/Storm'

/**
 * sqlite 中内置的表，用于记录主键自增信息
 */
class SqliteSequenceTable extends Table<SqliteSequence> {
  override readonly tableName = 'sqlite_sequence'
  readonly name = Column.text('name').bindTo(this, 'name')
  readonly seq = Column.integer('seq').bindTo(this, 'seq')
}

export const TableSqliteSequence = Storm.tableBuilder(SqliteSequenceTable).build()

export interface SqliteSequence {
  name: string
  seq: number
}