import { AutoMigration, Database, DatabaseMigration, MigrationHelper, Storm } from '@zxhhyj/storm';
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

class Migration_0_1 extends DatabaseMigration<AppDatabase> {
  readonly startVersion: number = 0
  readonly endVersion: number = 1

  migrate(tables: (BlobTable | BookTable | BookcaseTable)[], helper: MigrationHelper): void {

  }
}

export const myDatabase = Storm
  .databaseBuilder(AppDatabase)
  .addMigrations(AutoMigration)/*  .addMigrations(new Migration_0_1())*/
  .build()