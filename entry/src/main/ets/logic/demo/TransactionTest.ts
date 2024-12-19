import { myDatabase } from '../database/AppDatabase'
import { Bookcase } from '../model/Bookcase'
import { Test } from './Test'

export const TransactionTest: Test = {
  main: () => {
    try {
      const bookcase: Bookcase = {
        name: "科幻小说"
      }
      myDatabase.bookcaseDao.beginTransaction(it => {
        it.add(bookcase)
          .begin(() => {
            throw new Error('强制停止，让事务回滚')
          })
      })
    } catch (e) {
      //可在此查询数据以验证事务是否生效
    }
  },
  verify: function (): boolean {
    return myDatabase.bookcaseDao.count() <= 0
  },
  name: "TransactionTest"
}
