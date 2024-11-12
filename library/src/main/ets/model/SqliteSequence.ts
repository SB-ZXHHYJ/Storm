import { Column } from '../schema/Column'
import { Table } from '../schema/Table'

class SqliteSequences extends Table<SqliteSequence> {
  override readonly tableName = 'sqlite_sequence'
  readonly name = Column.text('name').bindTo(this, 'name')
  readonly seq = Column.integer('seq').bindTo(this, 'seq')
}

export const sqliteSequences = new SqliteSequences()

export declare class SqliteSequence {
  readonly name: string
  readonly seq: number
}