import { Column, SqlColumn, SqlTable, Table } from '../../../../Index'

class SqliteSequences extends Table<SqliteSequence> {
  override tableName = 'sqlite_sequence'
  readonly name = Column.string('name')
  readonly seq = Column.number('seq')

  updateVer(_oldVer: number, _newVer: number): void {
  }
}

export const sqliteSequences = new SqliteSequences()

@SqlTable(sqliteSequences)
export class SqliteSequence {
  @SqlColumn(sqliteSequences.name)
  declare name: string
  @SqlColumn(sqliteSequences.seq)
  declare seq: number
}