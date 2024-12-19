import { DatabaseDao } from '../../../../Index';
import { Table } from './Table';

export class Dao<T extends Table<any>> {
  protected readonly table: T
  protected readonly dao: DatabaseDao<T>

  static of<T extends Table<any>>(target: T) {
    return
  }
}