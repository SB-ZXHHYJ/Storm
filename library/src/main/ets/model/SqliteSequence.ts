import { Column } from '../schema/Column'
import { Table } from '../schema/Table'

/**
 * sqlite中内置的记录自增信息表
 */
class SqliteSequences extends Table<SqliteSequence> {
  override readonly tableName = 'sqlite_sequence'
  readonly name = Column.text('name').bindTo(this, 'name')
  readonly seq = Column.integer('seq').bindTo(this, 'seq')
}

export const sqliteSequences = new SqliteSequences()

export interface SqliteSequence {
  readonly name: string
  readonly seq: number
}