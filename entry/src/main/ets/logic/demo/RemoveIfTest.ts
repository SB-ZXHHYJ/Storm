import { database } from '@zxhhyj/storm'
import { Bookcase, bookcases } from '../model/Bookcase'
import { Test } from './Test'

export const RemoveIfTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    database
      .of(bookcases)
      .add(bookcase)
      .removeIf(it => it.equalTo(bookcases.name, "科幻小说")) //指定条件来删除数据
  },
  verify: function (): boolean {
    return database.of(bookcases).count() === 0
  },
  name: "RemoveIfTest"
}
