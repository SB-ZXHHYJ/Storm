import { Column, SqlColumn, SqlTable, Table } from '../../../../Index'

class StormTableVersions extends Table<StormTableVersion> {
  override readonly tableName = 't_storm_table_version'
  readonly name = Column.text('name')
  readonly version = Column.integer('version')
}

export const stormTableVersions = new StormTableVersions()

@SqlTable(stormTableVersions)
export class StormTableVersion {
  @SqlColumn(stormTableVersions.name)
  readonly name: string
  @SqlColumn(stormTableVersions.version)
  readonly version: number
}