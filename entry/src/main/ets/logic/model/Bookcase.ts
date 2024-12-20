import { Column, Table } from '@zxhhyj/storm';

export interface Bookcase {
  id?: number
  name: string
}

export class BookcaseTable extends Table<Bookcase> {
  readonly tableName = 't_bookcase'

  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').notNull().bindTo(this, 'name')
}

export const TableBookcase = new BookcaseTable()