import { database } from '@zxhhyj/storm'
import { Book, books } from '../model/Book'
import { Bookcase, bookcases } from '../model/Bookcase'
import { Test } from './Test'

export const AddTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    const book: Book = {
      name: "三体",
      bookcase: bookcase,
      createDataTime: new Date(),
      visibility: true
    }
    database
      .of(bookcases)
      .add(bookcase)//添加数据，添加成功后会将自增id填充到bookcase.id中
      .to(books)
      .add(book) //添加数据，添加成功后会将自增id填充到book.id中
  },
  verify: function (): boolean {
    const addBook = database.of(books).query().first()
    return addBook &&
      addBook.id !== undefined &&
      addBook.bookcase != undefined &&
      addBook.bookcase.id !== undefined &&
      addBook.visibility === true
  },
  name: "AddTest"
}
