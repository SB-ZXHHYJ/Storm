import { database } from '@zxhhyj/storm'
import { Book, books } from '../model/Book'
import { Bookcase, bookcases } from '../model/Bookcase'
import { Test } from './Test'

export const UpdateIfTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    const book: Book = {
      name: "三体",
      bookcase: bookcase,
      createDataTime: new Date()//sqlite本身是不支持存储Date类型的
    }
    database
      .of(bookcases)
      .add(bookcase)
      .to(books)
      .add(book) //可以正常添加
  },
  verify: function (): boolean {
    const addBook = database.of(books).query()[0]
    return addBook.createDataTime instanceof Date
  },
  name: "JsonTest"
}
