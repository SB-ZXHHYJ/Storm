import { Column, SqlColumn, SqlTable, Table } from '../../../../Index'

/**
 * 用于记录每一个表的版本号信息
 */
class StormTableVersions extends Table<StormTableVersion> {
  override readonly tableName = 't_storm_table_version'
  readonly name = Column.text('table_name')
  readonly version = Column.integer('table_version')
}

export const stormTableVersions = new StormTableVersions()

@SqlTable(stormTableVersions)
export class StormTableVersion {
  @SqlColumn(stormTableVersions.name)
  readonly name: string
  @SqlColumn(stormTableVersions.version)
  readonly version: number
}