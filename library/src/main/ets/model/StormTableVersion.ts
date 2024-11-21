import { Column } from '../schema/Column'
import { Table } from '../schema/Table'

/**
 * Storm中用于记录每一个表的版本号信息
 */
class StormTableVersions extends Table<StormTableVersion> {
  override readonly tableName = 't_storm_table_version'
  readonly name = Column.text('table_name').bindTo(this, 'name')
  readonly version = Column.integer('table_version').bindTo(this, 'version')
}

export const stormTableVersions = new StormTableVersions()

export interface StormTableVersion {
  readonly name: string
  readonly version: number
}