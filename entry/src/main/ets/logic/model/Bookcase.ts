import { Column, MigrationHelper, Storm, Table, TableMigration } from '@zxhhyj/storm';

export interface Bookcase {
  id?: number
  name: string
}

export class BookcaseTable extends Table<Bookcase> {
  readonly tableName = 't_bookcase'
  readonly targetVersion: number = 1

  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').notNull().bindTo(this, 'name')
}

class Migration_1_2 extends TableMigration<BookcaseTable> {
  readonly startVersion: number = 1
  readonly endVersion: number = 2

  migrate(table: BookcaseTable, helper: MigrationHelper): void {
  }
}

export const TableBookcase = Storm
  .tableBuilder(BookcaseTable)
  .addMigrations(new Migration_1_2())
  .build()