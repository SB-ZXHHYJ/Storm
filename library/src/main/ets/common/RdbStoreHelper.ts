import { SupportSqliteCmds } from './SupportSqliteCmds'
import { relationalStore } from '@kit.ArkData'

type SupportSqliteCmdsType = SupportSqliteCmds | Pick<SupportSqliteCmds, any> | Omit<SupportSqliteCmds, any>

export class RdbStoreHelper {
  constructor(private readonly rdbStore: relationalStore.RdbStore) {
  }

  /**
   * 执行 SQL 语句。
   * @param sql 要执行的 SQL 语句或 SupportSqliteCmds 对象。
   */
  executeSync(sql: string | SupportSqliteCmdsType) {
    const exeSql = sql.toString()
    if (exeSql.length > 0) {
      if (sql instanceof SupportSqliteCmds && !exeSql.endsWith(';')) {
        throw new Error('SupportSqliteCmds is not complete.')
      }
      this.rdbStore.executeSql(exeSql)
    }
  }
}