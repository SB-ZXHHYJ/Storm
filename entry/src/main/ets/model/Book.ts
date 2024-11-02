import { Column, SqlColumn, SqlTable, Table } from '@zxhhyj/storm';
import { Bookcase } from './Bookcase';

class Books extends Table<Book> {
  override tableName = 't_book'
  readonly bookcase = Column.entity('bookcase_id', Bookcase)
  readonly id = Column.number('id').primaryKey(true)
  readonly name = Column.string('name').notNull().unique()
}

export const books = new Books()

@SqlTable(books)
export class Book {
  @SqlColumn(books.id)
  id?: number
  @SqlColumn(books.bookcase)
  bookcase: Bookcase
  @SqlColumn(books.name)
  name: string
}