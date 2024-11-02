import { Column, SqlColumn, SqlTable, Table } from '@zxhhyj/storm';

class Bookcases extends Table<Bookcase> {
  override tableName = 't_bookcase'
  readonly id = Column.number('id').primaryKey(true)
  readonly name = Column.string('name').notNull().unique()
}

export const bookcases = new Bookcases()

@SqlTable(bookcases)
export class Bookcase {
  @SqlColumn(bookcases.id)
  id?: number
  @SqlColumn(bookcases.name)
  name: string
}