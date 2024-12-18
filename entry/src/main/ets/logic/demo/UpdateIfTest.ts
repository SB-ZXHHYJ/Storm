import { myDatabase } from '../database/AppDatabase'
import { Bookcase, TableBookcase } from '../model/Bookcase'
import { Test } from './Test'

export const UpdateIfTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    myDatabase.bookcaseDao
      .add(bookcase)
      .updateIf(it => it.equalTo(TableBookcase.id, bookcase.id), { name: '女生小说' }) //指定更新某一项
  },
  verify: function (): boolean {
    return myDatabase.bookcaseDao.first(it => it.equalTo(TableBookcase.name, "女生小说")) !== undefined
  },
  name: "UpdateIfTest"
}
