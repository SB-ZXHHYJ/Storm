import { Table } from '../schema/Table'

/**
 * 顾名思义，就是Nothing
 */
class Nothings extends Table<Nothing> {
  override readonly tableName = 't_nothing'
}

export const nothings = new Nothings()

export class Nothing {
}