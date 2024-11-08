import { Table } from '../schema/Table';
import { RdbPredicatesWrapper } from './RdbPredicatesWrapper';
import { relationalStore, ValueType } from '@kit.ArkData';
import { getSqlTable } from '../annotation/SqlTable';
import { ErrorUtils } from './ErrorUtils';

export class ResultSetUtils {
  /**
   * 查询数据库并将每一列数据转成 entity
   * @param rdbStore 数据源
   * @param wrapper 查询条件
   * @param targetTable 查询的表
   * @returns entity 数组
   */
  static queryToEntity<T>(rdbStore: relationalStore.RdbStore, wrapper: RdbPredicatesWrapper<T>,
    targetTable: Table<T>): T[] {
    const entityArray: T[] = [];
    const resultSet = rdbStore.querySync(wrapper._rdbPredicates);

    while (resultSet.goToNextRow()) {
      const entity = {} as T; // 创建一个空实体

      for (let i = 0; i < resultSet.columnNames.length; i++) {
        const columnName = resultSet.columnNames[i]; // 获取当前列名
        const column = targetTable._columnsLazy.value.find(col => col._fieldName === columnName); // 查找对应的列
        const value = resultSet.getValue(i) as ValueType // 获取当前列的值

        switch (true) {
          case column._typeConverters !== undefined: {
            entity[column._key] = column?._typeConverters?.restore(value)
            break
          }
          case column._objectConstructor !== undefined: {
            // 判断是否是列绑定
            const subEntity = Object.create(column._objectConstructor); // 创建列绑定类型的对象
            const relatedTable = getSqlTable(subEntity); // 获取绑定对象对应的表

            // 查找主键列
            const idColumn = relatedTable?._idColumnLazy.value
            if (idColumn === undefined) {
              ErrorUtils.IdColumnNotDefined(relatedTable)
            }
            const predicatesWrapper = new RdbPredicatesWrapper(relatedTable);
            predicatesWrapper.equalTo(idColumn, value as ValueType); // 通过主键和值信息查询

            entity[column._key] = ResultSetUtils.queryToEntity(rdbStore, predicatesWrapper, relatedTable)[0]
            break
          }
          default: {
            entity[column._key] = value
            break
          }
        }
      }

      entityArray.push(entity); // 将实体添加到结果数组中
    }

    resultSet.close(); // 关闭结果集
    return entityArray; // 返回实体数组
  }
}