import { Database, Storm } from '@zxhhyj/storm';
import { relationalStore } from '@kit.ArkData';
import { TableBookcase } from '../model/Bookcase';
import { DaoMyBook, TableBook } from '../model/Book';
import { TableBlob } from '../model/Blob';
import { Context } from '@kit.AbilityKit';
import { DatabaseMigration, DatabaseMigrationOptions } from '@zxhhyj/storm/src/main/ets/schema/DatabaseMigration';

class AppDatabase extends Database {
  initDb(context: Context) {
    return relationalStore.getRdbStore(context, { name: "app.db", securityLevel: relationalStore.SecurityLevel.S1 })
  }

  readonly blobDao = TableBlob
  readonly bookDao = TableBook
  readonly bookcaseDao = TableBookcase

  readonly myBookDao = DaoMyBook
}

class Migration_1_2 extends DatabaseMigration {
  startVersion: number = 1;
  endVersion: number = 2;

  migrate(options: DatabaseMigrationOptions): void {
    console.log('1_2')
  }
}

class Migration_2_3 extends DatabaseMigration {
  startVersion: number = 2;
  endVersion: number = 3;

  migrate(options: DatabaseMigrationOptions): void {
    console.log('2_3')
  }
}

export const myDatabase = Storm
  .databaseBuilder(AppDatabase)
  .addMigration(new Migration_1_2())
  .addMigration(new Migration_2_3())
  .build()