import { Column, Migration, Operate, Storm, Table } from '@zxhhyj/storm';

export interface Bookcase {
  id?: number
  name: string
}

class BookcaseTable extends Table<Bookcase> {
  readonly tableName = 't_bookcase'
  readonly targetVersion: number = 1

  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').notNull().bindTo(this, 'name')
}

const bookcasesMigration_1_2 = new class Migration_1_2 extends Migration<BookcaseTable> {
  readonly currentVersion: number = 1
  readonly targetVersion: number = 2

  migrate(operate: Operate<BookcaseTable>): void {
    operate.recreate([TableBookcase.id, TableBookcase.id])
    //相当与删除 name 列
  }
}

export const TableBookcase = Storm
  .tableBuilder(BookcaseTable)
  .addMigration(bookcasesMigration_1_2)
  .build()