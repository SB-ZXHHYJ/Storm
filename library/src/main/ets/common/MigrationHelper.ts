import { SupportSqliteCmds } from './SupportSqliteCmds'
import { relationalStore } from '@kit.ArkData'

export class MigrationHelper {
  private readonly rdbStore: relationalStore.RdbStore

  constructor(rdbStore: relationalStore.RdbStore) {
    this.rdbStore = rdbStore
  }

  executeSync(sql: string | SupportSqliteCmds) {
    this.rdbStore.executeSql(sql.toString())
  }
}