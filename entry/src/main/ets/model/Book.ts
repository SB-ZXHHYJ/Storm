import { Column, SqlColumn, SqlTable, Table } from '@zxhhyj/storm';
import { Bookcase, bookcases } from './Bookcase';

class Books extends Table<Book> {
  override readonly tableName = "t_book"
  readonly bookcase = Column.references("bookcase_id", bookcases)
  readonly id = Column.integer("id").primaryKey(true)
  readonly name = Column.text("name").unique()
}

export const books = new Books()

@SqlTable(books)
export class Book {
  @SqlColumn(books.id)
  id?: number
  @SqlColumn(books.name)
  name: string
  @SqlColumn(books.bookcase)
  bookcase: Bookcase
}