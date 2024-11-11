import { Column, SqlColumn, Table } from '@zxhhyj/storm';
import { Bookcase, bookcases } from './Bookcase';

class Books extends Table<Book> {
  override readonly tableName = 't_book'
  readonly id = Column.integer('id').primaryKey(true)
  readonly name = Column.text('name').unique()
  readonly bookcase = Column.references('bookcase_id', bookcases)
}

export const books = new Books()

export class Book {
  @SqlColumn(books.id)
  id?: number
  @SqlColumn(books.name)
  name: string
  @SqlColumn(books.bookcase)
  bookcase: Bookcase
}