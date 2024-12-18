import { myDatabase } from '../database/AppDatabase'
import { Bookcase, TableBookcase } from '../model/Bookcase'
import { Test } from './Test'

export const RemoveIfTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    myDatabase.bookcaseDao
      .add(bookcase)
      .removeIf(it => it.equalTo(TableBookcase.name, "科幻小说")) //指定条件来删除数据
  },
  verify: function (): boolean {
    return myDatabase.bookcaseDao.count() === 0
  },
  name: "RemoveIfTest"
}
