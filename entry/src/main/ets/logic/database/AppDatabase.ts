import { AutoMigration, Database, Storm } from '@zxhhyj/storm';
import { relationalStore } from '@kit.ArkData';
import { TableBookcase } from '../model/Bookcase';
import { DaoMyBook, TableBook } from '../model/Book';
import { TableBlob } from '../model/Blob';
import { Context } from '@kit.AbilityKit';

class AppDatabase extends Database {
  initDb(context: Context) {
    return relationalStore.getRdbStore(context, { name: "app.db", securityLevel: relationalStore.SecurityLevel.S1 })
  }

  readonly blobDao = TableBlob
  readonly bookDao = TableBook
  readonly bookcaseDao = TableBookcase

  readonly myBookDao = DaoMyBook
}

export const myDatabase = Storm
  .databaseBuilder(AppDatabase)
  .setVersion(1)//设置数据库的版本
  .addMigrations(AutoMigration)//设置当数据库未初始化时自动初始化，初始化后的版本号为 setVersion 设置版本号，即 1
  .build()