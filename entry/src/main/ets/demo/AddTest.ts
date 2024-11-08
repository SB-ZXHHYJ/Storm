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
      bookcase: bookcase
    }
    database
      .of(bookcases)
      .add(bookcase)//添加数据
      .to(books)
      .add(book)//添加数据
  },
  verify: function (): boolean {
    const addBook = database.of(books).query()[0]
    return (addBook && addBook.id !== undefined && addBook.bookcase != undefined)
  },
  name: "AddTest"
}
