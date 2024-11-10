import { Column, Table } from '../../../../Index'

/**
 * 用于记录每一个表的版本号信息
 */
class StormTableVersions extends Table<StormTableVersion> {
  override readonly tableName = 't_storm_table_version'
  readonly name = Column.text('table_name').bindTo(this, 'version')
  readonly version = Column.integer('table_version').bindTo(this, 'version')
}

export const stormTableVersions = new StormTableVersions()

export class StormTableVersion {
  readonly name: string
  readonly version: number
}