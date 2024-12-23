import { myDatabase } from '../database/AppDatabase';
import { TableBook } from '../model/Book';

() => {
  const count = myDatabase.bookDao.count()
  //查询 BookTable 在数据库中有多少条数据
};

() => {
  const count = myDatabase.bookDao.count(it => it.equalTo(TableBook.name, '三体'))
  //查询 BookTable 在数据库中有多少条符合条件数据
};

() => {
  const list = myDatabase.bookDao.toList()
  //查询 BookTable 在数据库中全部的数据
};

() => {
  const list = myDatabase.bookDao.toList(it => it.equalTo(TableBook.name, '三体'))
  //查询 BookTable 在数据库中符合条件的全部数据
};

() => {
  const list = myDatabase.bookDao.toList(it => it.equalTo(TableBook.name, '三体'), TableBook.name)
  for (const listElement of list) {
    console.log(listElement.name.toString())
    listElement.id //ide 会报错，找不到这个属性
  }
  //查询 BookTable 在数据库中符合条件的全部数据，同时指定只查询 name 列
};

() => {
  const list = myDatabase.bookDao.first()
  //查询 BookTable 在数据库中的第一条的数据，如果不存在数据将抛出异常
};

() => {
  const list = myDatabase.bookDao.firstOrNull()
  //查询 BookTable 在数据库中的第一条的数据，如果不存在则返回 Null
};