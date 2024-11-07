import { Column, SqlColumn, SqlTable, Table } from '../../../../Index'

class SqliteSequences extends Table<SqliteSequence> {
  override tableName = 'sqlite_sequence'
  readonly name = Column.string('name')
  readonly seq = Column.number('seq')
}

export const sqliteSequences = new SqliteSequences()

@SqlTable(sqliteSequences)
export class SqliteSequence {
  @SqlColumn(sqliteSequences.name)
  name: string
  @SqlColumn(sqliteSequences.seq)
  seq: number
}