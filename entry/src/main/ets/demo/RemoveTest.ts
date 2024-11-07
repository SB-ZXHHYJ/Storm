import { database } from '@zxhhyj/storm'
import { Bookcase, bookcases } from '../model/Bookcase'
import { Test } from './Test'

export const RemoveTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    database
      .of(bookcases)
      .add(bookcase)
      .remove(bookcase)
  },
  verify: function (): boolean {
    return database.of(bookcases).query().length === 0
  },
  name: "RemoveTest"
}
