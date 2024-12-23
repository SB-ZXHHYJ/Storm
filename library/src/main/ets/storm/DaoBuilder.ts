import { Constructor } from '../common/Types';
import { Dao, ExtractDaoTable } from '../schema/Dao';
import { Table } from '../schema/Table';

export class DaoBuilder<T extends Dao<any>> {
  private targetTable: Table<any>

  constructor(private readonly daoConstructor: Constructor<T>) {
  }

  /**
   * 设置为哪个表来创建 Dao
   *
   * @param targetTable 目标表
   * @returns this
   */
  select(targetTable: ExtractDaoTable<T>) {
    if (targetTable && this.targetTable === undefined) {
      this.targetTable = targetTable
    } else {
      throw new Error('The select Table object is invalid.')
    }
    return this
  }

  /**
   * 构建 Dao 实例
   *
   * @returns Dao 实例
   */
  build() {
    return new this.daoConstructor(this.targetTable, undefined)
  }
}