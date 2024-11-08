import { Column, SqlColumn, SqlTable, Table } from '@zxhhyj/storm';

class NewVerBookcase extends Table<NewBookcase> {
  override readonly tableVersion = 2
  override readonly tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true)
  readonly name = Column.text('name').notNull().unique()
  readonly createDataTime = Column.date("create_data_time").default(new Date().toString())

  override upVersion(version: number) {
    if (version === 2) {
      return {
        add: [this.createDataTime]
      }
    }
  }
}

export const newVerBookcase = new NewVerBookcase()

@SqlTable(newVerBookcase)
export class NewBookcase {
  @SqlColumn(newVerBookcase.id)
  id?: number
  @SqlColumn(newVerBookcase.name)
  name: string
  @SqlColumn(newVerBookcase.createDataTime)
  createDataTime?: Date
}