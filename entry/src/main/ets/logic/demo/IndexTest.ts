import { database } from '@zxhhyj/storm';
import { books } from '../model/Book';
import { Test } from './Test';

export const IndexTest: Test = {
  main: () => {
    database.of(books);
  },
  verify: function (): boolean {
    // 检查索引表是否存在
    const indexName = books.datetimeIndex.fieldName;
    const rs =
      database.globalDatabase.rdbStore.querySqlSync(`SELECT * FROM sqlite_master WHERE type='index' AND name='${indexName}'`)
    return rs.rowCount > 0
  },
  name: "IndexTest"
}