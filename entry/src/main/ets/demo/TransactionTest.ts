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
          //在这个lambda中对数据库的操作都属于同一个事务
          bookcase.name = "女生小说"
          it.update(bookcase)
          throw new Error('强制停止') //强制停止
        })
    } catch (e) {
      //在此查询数据已验证事务是否生效
    }
  },
  verify: function (): boolean {
    return database.of(bookcases).query(it => it.equalTo(bookcases.name, "科幻小说"))[0] !== undefined
  },
  name: "TransactionTest"
}
