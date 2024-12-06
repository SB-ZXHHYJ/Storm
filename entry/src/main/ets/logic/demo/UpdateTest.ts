import { database } from '@zxhhyj/storm'
import { Bookcase, bookcases } from '../model/Bookcase'
import { Test } from './Test'

export const UpdateTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    database
      .of(bookcases)
      .add(bookcase)
      .run(() => {
        bookcase.name = "女生小说" //修改name
      })
      .update(bookcase) //将修改后的name更新到数据库中
  },
  verify: function (): boolean {
    return database.of(bookcases).first(it => it.equalTo(bookcases.name, "女生小说")) !== undefined
  },
  name: "UpdateTest"
}
