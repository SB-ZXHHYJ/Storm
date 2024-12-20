import { myDatabase } from '../database/AppDatabase'
import { Book } from '../model/Book'
import { Bookcase } from '../model/Bookcase'
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
    myDatabase.bookcaseDao.add(bookcase)
    myDatabase.bookDao.add(book)
//    myDatabase.myBookDao.add(book)
  },
  verify: function (): boolean {
    const addBook = myDatabase.bookDao.first()
    return addBook &&
      addBook.id !== undefined &&
      addBook.bookcase != undefined &&
      addBook.bookcase.id !== undefined &&
      addBook.visibility === true
  },
  name: "AddTest"
}
