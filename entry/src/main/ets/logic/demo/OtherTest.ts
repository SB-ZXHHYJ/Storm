import { myDatabase } from '../database/AppDatabase'
import { Book } from '../model/Book'
import { Test } from './Test'

const indexes: readonly number[] = [0, 1, 2, 3, 4, 5]

export const OtherTest: Test = {
  main: () => {
    for (const index of indexes) {
      const book: Book = {
        name: `${index}`,
        createDataTime: new Date(),
        visibility: true,
        bookcase: undefined!!
      }
      myDatabase.bookDao.add(book)
    }
  },
  verify: () => {
    if (!myDatabase.bookDao.count()) {
      return false
    }

    if (!myDatabase.bookDao.toList()) {
      return false
    }

    if (!myDatabase.bookDao.firstOrNull()) {
      return false
    }

    if (!myDatabase.bookDao.first()) {
      return false
    }

    const lastOrNull = myDatabase.bookDao.lastOrNull()
    if (!(lastOrNull && lastOrNull.name === indexes[indexes.length-1].toString())) {
      return false
    }

    if (!myDatabase.bookDao.last()) {
      return false
    }

    return true
  },
  name: "OtherTest"
}