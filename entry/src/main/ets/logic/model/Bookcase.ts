import { Column, Migration, Operate, Table } from '@zxhhyj/storm';

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

class BookcasesMigration extends Migration<Bookcases> {
  readonly tableVersion: number = 2

  onVersionUp(targetVersion: number, operate: Operate<Bookcases>): void {
    if (targetVersion === 2) {
      operate.addColumn(bookcases.name)
    }
  }
}

const bookcasesMigration = new BookcasesMigration()