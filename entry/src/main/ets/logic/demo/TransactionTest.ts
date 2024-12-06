import { database } from '@zxhhyj/storm'
import { Bookcase, bookcases } from '../model/Bookcase'
import { Test } from './Test'

export const TransactionTest: Test = {
  main: () => {
    try {
      const bookcase: Bookcase = {
        name: "科幻小说"
      }
      database
        .beginTransaction(it => it
          .to(bookcases)
          .add(bookcase)
          .run(() => {
            throw new Error('强制停止，让事务回滚')
          })
        )
    } catch (e) {
      //在此查询数据以验证事务是否生效
    }
  },
  verify: function (): boolean {
    return database.of(bookcases).count() <= 0
  },
  name: "TransactionTest"
}
