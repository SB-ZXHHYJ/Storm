import { Database, DatabaseMigration, MigrationHelper, Storm } from '@zxhhyj/storm';
import { relationalStore } from '@kit.ArkData';
import { BookcaseTable, TableBookcase } from '../model/Bookcase';
import { BookTable, DaoMyBook, TableBook } from '../model/Book';
import { BlobTable, TableBlob } from '../model/Blob';
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

class Migration_1_2 extends DatabaseMigration<AppDatabase> {
  startVersion: number = 1;
  endVersion: number = 2;

  migrate(table: BlobTable | BookTable | BookcaseTable, helper: MigrationHelper): void {
    console.log('1_2')
    //执行迁移逻辑
  }
}

export const myDatabase = Storm
  .databaseBuilder(AppDatabase)
  // .addMigrations(new Migration_1_2())
  .build()