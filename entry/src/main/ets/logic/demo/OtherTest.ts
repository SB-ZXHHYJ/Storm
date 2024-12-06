import { database } from '@zxhhyj/storm'
import { Book, books } from '../model/Book'
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
      database
        .of(books)
        .add(book)
    }
  },
  verify: () => {

    if (!database.of(books).count()) {
      return false
    }

    if (!database.of(books).toList()) {
      return false
    }

    if (!database.of(books).toListOrNull()) {
      return false
    }

    if (!database.of(books).firstOrNull()) {
      return false
    }

    if (!database.of(books).first()) {
      return false
    }

    const lastOrNull = database.of(books).lastOrNull()
    if (!(lastOrNull && lastOrNull.name === indexes[indexes.length-1].toString())) {
      return false
    }

    if (!database.of(books).last()) {
      return false
    }

    return true
  },
  name: "OtherTest"
}