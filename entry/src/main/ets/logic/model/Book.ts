import { Column, Table } from '@zxhhyj/storm';
import { Bookcase, bookcases } from './Bookcase';

class Books extends Table<Book> {
  override readonly tableName = 't_book'
  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').unique().bindTo(this, 'name')
  readonly bookcase = Column.references('bookcase_id', bookcases).bindTo(this, 'bookcase')
  readonly createDataTime =
    Column.date('create_data_time').default(new Date().toString()).bindTo(this, 'createDataTime')
}

export const books = new Books()

export class Book {
  id?: number
  name: string
  bookcase: Bookcase
  createDataTime: Date
}