import { Column, Table, TableUpdateInfo } from '@zxhhyj/storm';

class NewVerBookcases extends Table<NewBookcase> {
  override readonly tableVersion = 2
  /**
   * 需要注意的是，这个NewVerBookcases实际就是Bookcases，只是方便做演示用例才创建了两个类
   */
  override readonly tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').notNull().bindTo(this, 'name')
  /**
   * 这个是新增的列
   */
  readonly createDataTime =
    Column.date('create_data_time').default(new Date().toString()).bindTo(this, 'createDataTime')

  upVersion(version: number): TableUpdateInfo {
    /**
     * 当不显示声明tableVersion时，默认的版本为1，NewVerBookcases的最新版本为2
     * upVersion将被调用一次，upVersion(2)
     */
    if (version === 2) {
      //在此返回这个版本中表有哪些更新
      return {
        add: [this.createDataTime],
        //remove: [this.name]
        //不知道为什么同步执行删除指令时会报错？添加则没有问题，感觉是华子的问题
      }
    }
  }
}

export const newVerBookcases = new NewVerBookcases()

export declare class NewBookcase {
  id?: number
  name: string
  createDataTime?: Date
}