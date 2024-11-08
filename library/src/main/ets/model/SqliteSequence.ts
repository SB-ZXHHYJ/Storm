import { Column, SqlColumn, SqlTable, Table } from '../../../../Index'

class SqliteSequences extends Table<SqliteSequence> {
  override tableName = 'sqlite_sequence'
  readonly name = Column.text('name')
  readonly seq = Column.integer('seq')
}

export const sqliteSequences = new SqliteSequences()

@SqlTable(sqliteSequences)
export class SqliteSequence {
  @SqlColumn(sqliteSequences.name)
  name: string
  @SqlColumn(sqliteSequences.seq)
  seq: number
}