import { Column, Table } from '@zxhhyj/storm';

class Bookcases extends Table<Bookcase> {
  override readonly tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').notNull().unique().bindTo(this, 'name')
}

export const bookcases = new Bookcases()

export interface Bookcase {
  id?: number
  name: string
}