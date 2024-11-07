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
        bookcase.name = "女生小说"
      })
      .update(bookcase)
  },
  verify: function (): boolean {
    return database.of(bookcases).query(it => it.equalTo(bookcases.name, "女生小说"))[0] !== undefined
  },
  name: "UpdateTest"
}
