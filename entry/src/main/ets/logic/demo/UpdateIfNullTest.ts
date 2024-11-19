import { database } from '@zxhhyj/storm'
import { Book, books } from '../model/Book'
import { Bookcase, bookcases } from '../model/Bookcase'
import { Test } from './Test'

export const UpdateIfNullTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    const book: Book = {
      name: "三体",
      bookcase: bookcase,
      createDataTime: new Date()
    }
    database
      .of(bookcases)
      .add(bookcase)//添加数据，添加成功后会将自增id填充到bookcase.id中
      .to(books)
      .add(book)//添加数据，添加成功后会将自增id填充到book.id中
      .updateIf(it => it.equalTo(books.id, book.id),
        [[books.name, null]]) //将这一列的内容删掉，如果使用常规的update更新，你需要满足类型检查，这样的操作可以避免类型检查
  },
  verify: function (): boolean {
    return database.of(books).query(it => it.isNull(books.name)).toList().length > 0
  },
  name: "UpdateIfNullTest"
}