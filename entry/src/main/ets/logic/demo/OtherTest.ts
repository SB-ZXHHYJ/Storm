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
    const query = database
      .of(books)
      .query()

    if (!query.length) {
      return false
    }

    if (!query.toMutableList()) {
      return false
    }

    if (!query.toList()) {
      return false
    }

    if (!query.firstOrNull()) {
      return false
    }

    if (!query.first()) {
      return false
    }

    const lastOrNull = query.lastOrNull()
    if (!(lastOrNull && lastOrNull.name === indexes[indexes.length-1].toString())) {
      return false
    }

    if (!query.last()) {
      return false
    }

    return true
  },
  name: "OtherTest"
}