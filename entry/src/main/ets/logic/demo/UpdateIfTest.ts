import { database } from '@zxhhyj/storm'
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
      .updateIf(it => it.equalTo(bookcases.id, bookcase.id), { name: '女生小说' }) //指定更新某一项
  },
  verify: function (): boolean {
    return database.of(bookcases).first(it => it.equalTo(bookcases.name, "女生小说")) !== undefined
  },
  name: "UpdateIfTest"
}
