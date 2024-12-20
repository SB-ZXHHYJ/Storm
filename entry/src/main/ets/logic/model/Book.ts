import { Column, Dao, Storm, Table } from '@zxhhyj/storm';
import { Bookcase, TableBookcase } from './Bookcase';

export interface Book {
  id?: number
  name: string
  bookcase: Bookcase
  createDataTime: Date
  visibility: boolean
}

export class BookTable extends Table<Book> {
  readonly tableName = 't_book'

  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').unique().bindTo(this, 'name')
  readonly bookcase = Column.references('bookcase_id', TableBookcase).bindTo(this, 'bookcase')
  readonly createDataTime =
    Column.date('create_data_time').default(new Date().toString()).bindTo(this, 'createDataTime')
  readonly visibility = Column.boolean('visibility').bindTo(this, 'visibility')
  readonly datetimeIndex =
    Column.index('t_book_index_name').column(this.name, 'ASC').column(this.visibility).bindTo(this)
}

export const TableBook = new BookTable()

class MyBookDao extends Dao<BookTable> {
  add(book: Book) {
    this.dao.add(book)
    //...
  }

  remove(book: Book) {
    this.dao.remove(book)
    //...
  }

  //...
}

export const DaoMyBook = Storm.daoBuilder(MyBookDao).select(TableBook).build()