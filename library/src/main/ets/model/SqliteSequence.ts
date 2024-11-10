import { Column, Table } from '../../../../Index'

class SqliteSequences extends Table<SqliteSequence> {
  override readonly tableName = 'sqlite_sequence'
  readonly name = Column.text('name').bindTo(this, 'name')
  readonly seq = Column.integer('seq').bindTo(this, 'seq')
}

export const sqliteSequences = new SqliteSequences()

export class SqliteSequence {
  readonly name: string
  seq: number
}