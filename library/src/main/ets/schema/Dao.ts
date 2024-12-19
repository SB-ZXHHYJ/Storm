import { DatabaseDao } from '../../../../Index';
import { Table } from './Table';

export type ExtractDaoTable<T extends Dao<any>> = T extends Dao<infer M> ? M : never

export class Dao<T extends Table<any>> {
  table: T
  dao: DatabaseDao<T>

  constructor(table: T, dao: DatabaseDao<T>) {
    this.table = table
    this.dao = dao
  }
}