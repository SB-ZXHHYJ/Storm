import { Column, Table } from '../schema/Table'
import { RdbPredicatesWrapper } from './RdbPredicatesWrapper'
import { relationalStore, ValueType } from '@kit.ArkData'
import { getSqlTable } from '../annotation/SqlTable'

export class ResultSetUtils {
  /**
   * 查询数据库并将每一列数据转成entity
   * @param rdbStore 数据源
   * @param wrapper 查询条件
   * @param table 查询的表
   * @returns entity数组
   */
  static queryToEntity<T>(rdbStore: relationalStore.RdbStore, wrapper: RdbPredicatesWrapper<T>, table: Table<T>): T[] {
    const columns: Column<ValueType>[] = Object.values(table).filter((item => {
      return item instanceof Column
    }))
    const entityArray = []
    const resultSet = rdbStore.querySync(wrapper.rdbPredicates)
    while (resultSet.goToNextRow()) {
      const entity = {}
      //创建一个空实体
      for (let i = 0; i < resultSet.columnNames.length; i++) {
        //处理每一个column
        const column = columns.find(value => {
          return value.fieldName == resultSet.columnNames[i]
        })
        //获取table中fieldName与columnName一致的列
        const value = resultSet.getValue(i)
        //这个column的值
        if (column) {
          if (column.entityPrototype) {
            //判断是不是列绑定
            const sEntity = Object.create(column.entityPrototype)
            //创建这个列所绑定类型的对象
            const table = getSqlTable(sEntity)
            //获取这个绑定对象所对应的table
            const idColumn: Column<ValueType> = Object.values(table).find((item => {
              return (item instanceof Column) && item.isPrimaryKey
            }))
            const predicatesWrapper = new RdbPredicatesWrapper(table)
            predicatesWrapper.equalTo(idColumn, value as ValueType)
            //通过这个主键和value信息进行查询绑定
            column.entityBindFunction(entity, ResultSetUtils.queryToEntity(rdbStore, predicatesWrapper, table)[0])
            continue
          }
          column.entityBindFunction(entity, value)
        }
      }
      entityArray.push(entity)
    }
    resultSet.close()
    return entityArray
  }
}