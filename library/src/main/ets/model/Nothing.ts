import { Table } from '../schema/Table'

class Nothings extends Table<Nothing> {
  override readonly tableName = 't_nothing'
}

export const nothings = new Nothings()

export declare class Nothing {
}