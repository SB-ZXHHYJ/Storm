import { Column, SqlColumn, SqlTable, Table } from '@zxhhyj/storm';
import { Bookcase } from './Bookcase';

class Books extends Table<Book> {
  override tableName = 't_book'
  readonly bookcase = Column.entity('bookcase_id', Bookcase)
  readonly id = Column.number('id').id(true)
  readonly name = Column.string('name').notNull().unique()
}

export const books = new Books()

@Observed
@SqlTable(books)
export class Book {
  @SqlColumn(books.id)
  declare id?: number
  @SqlColumn(books.bookcase)
  declare bookcase: Bookcase
  @SqlColumn(books.name)
  declare name: string
}