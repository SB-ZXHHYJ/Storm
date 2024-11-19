import { Column, Table } from '@zxhhyj/storm';

class NewVerBookcases extends Table<NewBookcase> {
  override readonly tableVersion = 2
  /**
   * 需要注意的是，这个NewVerBookcases实际就是Bookcases，只是方便做演示用例才创建了两个类
   */
  override readonly tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  /**
   * 这个是新增的列
   */
  readonly createDataTime =
    Column.date('create_data_time').default(new Date().toString()).bindTo(this, 'createDataTime')
}

export const newVerBookcases = new NewVerBookcases()

export class NewBookcase {
  id?: number
  createDataTime: Date
}