import { database } from '@zxhhyj/storm'
import { books } from '../model/Book'
import { bookcases } from '../model/Bookcase'

export default () => {
  for (const queryElement of database.of(books).query()) {
    //遍历全部
  }
  for (const queryElement of database.of(books).query(it => it.equalTo(bookcases.name, "科幻小说"))) {
    //指定查询条件并遍历
  }
  const list = database.of(books).query().toList()
  //获取全部的数据
  const firstOrNull = database.of(books).query().firstOrNull()
  //查询第一项的数据（可能不存在)
  const first = database.of(books).query().first()
  //查询第一项的数据（必定存在)
}