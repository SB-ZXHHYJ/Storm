import { Column, Storm, Table, TableMigration, TableMigrationOptions } from '@zxhhyj/storm';

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

class Migration_1_2 extends TableMigration<BookcaseTable> {
  readonly startVersion: number = 1
  readonly endVersion: number = 2

  migrate(options: TableMigrationOptions<BookcaseTable>): void {

  }
}

export const TableBookcase = Storm
  .tableBuilder(BookcaseTable)
  .addMigration(new Migration_1_2())
  .build()