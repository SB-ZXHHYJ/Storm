import { Column, SqlColumn, Table } from '@zxhhyj/storm';

class Bookcases extends Table<Bookcase> {
  override readonly tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true)
  readonly name = Column.text('name').notNull().unique()
}

export const bookcases = new Bookcases()

export class Bookcase {
  @SqlColumn(bookcases.id)
  id?: number
  @SqlColumn(bookcases.name)
  name: string
}