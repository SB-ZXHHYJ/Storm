import { myDatabase } from '../database/AppDatabase'
import { Book, TableBook } from '../model/Book'
import { Bookcase } from '../model/Bookcase'
import { Test } from './Test'

export const UpdateIfNullTest: Test = {
  main: () => {
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    const book: Book = {
      name: "三体",
      bookcase: bookcase,
      createDataTime: new Date(),
      visibility: false
    }

    myDatabase.beginTransaction((it) => {
      myDatabase.bookcaseDao
        .add(bookcase) //添加数据，添加成功后会将自增 id 填充到 bookcase.id 中
      myDatabase.bookDao
        .add(book)//添加数据，添加成功后会将自增 id 填充到 book.id 中
        .updateIf(it => it.equalTo(TableBook.id, book.id), { name: null })
      //将这一列的内容删掉，如果使用常规的 update 更新，你需要满足类型检查，updateIf 可以避免类型检查
    })
  },
  verify: function (): boolean {
    return myDatabase.bookDao.count(it => it.isNull(TableBook.name)) > 0
  },
  name: "UpdateIfNullTest"
}