import { myDatabase } from '../database/AppDatabase'
import { Bookcase } from '../model/Bookcase'
import { Test } from './Test'

export const TransactionTest: Test = {
  main: () => {
    try {
      const bookcase: Bookcase = {
        name: "科幻小说"
      }
      myDatabase.bookcaseDao.beginTransaction(database => {
        database.add(bookcase)
        throw new Error('强制停止，让事务回滚')
      })
    } catch (e) {
      //...
    }
  },
  verify: function (): boolean {
    return myDatabase.bookcaseDao.count() <= 0
  },
  name: "TransactionTest"
}
