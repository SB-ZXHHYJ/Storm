import { Column, SqlColumn, SqlTable, Table, TableUpdateInfo } from '@zxhhyj/storm';

class NewVerBookcase extends Table<NewBookcase> {
  override readonly tableVersion = 2
  override readonly tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true)
  readonly name = Column.text('name')
  readonly createDataTime = Column.date("create_data_time").default(new Date().toString())

  upVersion(version: number): TableUpdateInfo {
    if (version === 2) {
      return {
        add: [this.createDataTime],
        //remove: [this.name] //不知道为什么同步执行删除指令时会报错，非同步不报错但是又会没有效果
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