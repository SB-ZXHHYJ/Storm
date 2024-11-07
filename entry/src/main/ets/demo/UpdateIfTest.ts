import { database } from '@zxhhyj/storm'
import { books } from '../model/Book'
import { Bookcase, bookcases } from '../model/Bookcase'
import { Test } from './Test'

export const UpdateIfTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    database
      .of(bookcases)
      .add(bookcase)
      .updateIf(it => it.equalTo(bookcases.id, bookcase.id), [[bookcases.name, "女生小说"]])
  },
  verify: function (): boolean {
    return database.of(bookcases).query(it => it.equalTo(bookcases.name, "女生小说"))[0] !== undefined
  },
  name:"UpdateIfTest"
}
