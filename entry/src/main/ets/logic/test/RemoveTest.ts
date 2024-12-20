import { myDatabase } from '../database/AppDatabase'
import { TableBook } from '../model/Book'
import { Bookcase } from '../model/Bookcase'
import { Test } from './Test'

const bookcase: Bookcase = {
  name: "《月老馒不懂》"
}

export const RemoveTest: Test = {
  main: () => {
    myDatabase.bookcaseDao
      .add(bookcase)
      .remove(bookcase) //移除数据
  },
  verify: function (): boolean {
    return myDatabase.bookcaseDao.count(it => it.equalTo(TableBook.name, bookcase.name)) === 0
  },
  name: "RemoveTest"
}
