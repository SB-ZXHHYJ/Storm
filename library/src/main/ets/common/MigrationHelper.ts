import { SupportSqliteCmds } from './SupportSqliteCmds'
import { relationalStore } from '@kit.ArkData'

export class MigrationHelper {
  private readonly rdbStore: relationalStore.RdbStore

  constructor(rdbStore: relationalStore.RdbStore) {
    this.rdbStore = rdbStore
  }

  executeSync(sql: string | SupportSqliteCmds) {
    if (sql instanceof SupportSqliteCmds) {
      const exeSql = sql.build()
      if (exeSql.length > 0) {
        this.rdbStore.executeSql(exeSql)
      }
      return
    }
    this.rdbStore.executeSql(sql)
  }
}