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
        .of(bookcases)
        .add(bookcase)
        .beginTransaction(it => {
          bookcase.name = "女生小说"
          it.update(bookcase)
          throw new Error('强制停止')
        })
    } catch (e) {
    }
  },
  verify: function (): boolean {
    return database.of(bookcases).query(it => it.equalTo(bookcases.name, "科幻小说"))[0] !== undefined
  },
  name: "TransactionTest"
}
