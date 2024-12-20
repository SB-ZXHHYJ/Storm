import { myDatabase } from '../database/AppDatabase'
import { Bookcase, TableBookcase } from '../model/Bookcase'
import { Test } from './Test'

export const UpdateTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    myDatabase.bookcaseDao
      .add(bookcase)
      .begin(() => {
        bookcase.name = "女生小说" //修改name
      })
      .update(bookcase) //将修改后的name更新到数据库中
  },
  verify: function (): boolean {
    return myDatabase.bookcaseDao.first(it => it.equalTo(TableBookcase.name, "女生小说")) !== undefined
  },
  name: "UpdateTest"
}
