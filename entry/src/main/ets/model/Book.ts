import { Column, SqlColumn, SqlTable, Table } from '@zxhhyj/storm';
import { Bookcase } from './Bookcase';

class Books extends Table<Book> {
  override readonly tableName = "t_book"
  readonly bookcase = Column.entity("bookcase_id", Bookcase)
  readonly id = Column.integer("id").primaryKey(true)
  readonly name = Column.text("name").unique()
  readonly createDataTime = Column.date("create_data_time")
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
  @SqlColumn(books.createDataTime)
  createDataTime?: Date
}