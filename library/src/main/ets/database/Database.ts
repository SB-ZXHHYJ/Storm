import { Context } from '@ohos.arkui.UIContext';
import { relationalStore, ValueType } from '@kit.ArkData';
import { Column, Table } from '../schema/Table';
import { SqlUtils } from '../utils/SqlStringBuilder';
import 'reflect-metadata';
import { RdbPredicatesWrapper } from '../utils/RdbPredicatesWrapper';
import { getSqlTable } from '../annotation/SqlTable';
import { getSqlColumn } from '../annotation/SqlColumn';
import { ResultSetUtils } from '../utils/ResultSetUtils';
import { SqliteSequence, sqliteSequences } from '../model/SqliteSequence';
import { LazyInitValue } from '../utils/ILazyInit';
import { ErrorUtils } from '../utils/ErrorUtils';

export class Database {
  private rdbStore: relationalStore.RdbStore

  private constructor(rdbStore: relationalStore.RdbStore) {
    this.rdbStore = rdbStore
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    return this.rdbStore.close()
  }

  /**
   * 对表进行增删改查的操作
   * @param targetTable 要操作的表
   * @returns 返回这个表的操作对象
   */
  sequenceOf<T>(table: Table<T>) {
    return new DatabaseSequenceQueues<T>(this.rdbStore, table)
  }

  static create(context: Context, config: relationalStore.StoreConfig): Promise<Database> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbStore = await relationalStore.getRdbStore(context, config)
        resolve(new Database(dbStore))
      } catch (e) {
        reject(e)
      }
    })
  }
}

export class DatabaseSequenceQueues<T> {
  private readonly rdbStore: relationalStore.RdbStore
  private readonly targetTable: Table<T>
  private readonly idColumnLazy = new LazyInitValue(() => {
    const idColumn: Column<any> =
      Object.values(this.targetTable).find((item) => item instanceof Column && item._isPrimaryKey);
    if (idColumn == undefined) {
      ErrorUtils.IdColumnNotDefined(this.targetTable)
    }
    return idColumn
  })

  constructor(rdbStore: relationalStore.RdbStore, targetTable: Table<T>) {
    this.rdbStore = rdbStore
    this.targetTable = targetTable
  }

  private modelsToValueBuckets(models: any[]) {
    const valueBuckets = models.map((value) => {
      const valueBucket: relationalStore.ValuesBucket = {};
      for (const keysElement of Object.keys(value)) {
        const currentValue = value[keysElement];
        const column = getSqlColumn(this.targetTable._entityPrototype.prototype, keysElement);
        if (column) {
          if (column._entityPrototype) {
            const subTable = getSqlTable(column._entityPrototype);
            if (subTable) {
              const idColumn = Object.values(subTable).find((item) => item instanceof Column && item._isPrimaryKey);
              if (idColumn) {
                // 从插入的数据里获取id
                const itemId = currentValue[idColumn.fieldName];
                if (itemId) {
                  valueBucket[column._fieldName] = itemId;
                  continue;
                }
              }
            }
          }
          valueBucket[column._fieldName] = currentValue;
        }
      }
      return valueBucket;
    });
    return valueBuckets
  }

  /**
   * 开启事务
   * @param scope 仅限在这个lambda中的操作
   * @returns this
   */
  beginTransaction<E extends DatabaseSequenceQueues<T>>(scope: (it: E) => void) {
    try {
      this.rdbStore.beginTransaction()
      scope.call(undefined, this)
      this.rdbStore.commit()
    } catch (e) {
      this.rdbStore.rollBack()
      throw e
    }
    return this
  }

  /**
   * 从表中插入内容
   * @param models 要插入的内容
   * @returns 插入的内容行数
   */
  inserts(models: T[]) {
    if (models.length == 0) {
      return 0
    }
    // 查询SqlSequence，用于记录自增信息
    const sqlSequenceQuery =
      ResultSetUtils.queryToEntity(this.rdbStore, new RdbPredicatesWrapper(sqliteSequences), sqliteSequences);

    const valueBuckets = this.modelsToValueBuckets(models)

    // 创建目标表（如果不存在）
    this.rdbStore.executeSync(SqlUtils.getTableCreateSql(this.targetTable));

    if (this.idColumnLazy.value) {
      // 更新每个值桶中的主键字段
      valueBuckets.forEach((valueBucket) => {
        if (valueBucket[this.idColumnLazy.value._fieldName] == null) {
          // 获取表对应的最新自增id
          const sqlSequence = sqlSequenceQuery.find((value) => value.name === this.targetTable.tableName);
          if (sqlSequence) {
            valueBucket[this.idColumnLazy.value._fieldName] = sqlSequence.seq += 1;
          } else {
            // 如果没有找到序列，则创建一个新的序列
            const newSqlSequence: SqliteSequence = { name: this.targetTable.tableName, seq: 1 };
            sqlSequenceQuery.push(newSqlSequence);
            valueBucket[this.idColumnLazy.value._fieldName] = newSqlSequence.seq;
          }
        }
      })
    }

    // 批量插入数据到目标表
    const insertedCount = valueBuckets
      .map(item => {
        return this.rdbStore.insertSync(this.targetTable.tableName, item) != -1;
      })
      .filter((item) => {
        return item
      })
      .length

    // 更新原始模型对象以包含新插入的ID
    models.forEach((model, i) => {
      Object.entries(valueBuckets[i]).forEach(([key, value]) => {
        model[key] = value;
      });
    });

    return insertedCount; // 返回插入操作成功的数量
  }

  /**
   * 从表中更新内容
   * @param models 要更新的内容
   * @returns 更新的内容行数
   */
  update(models: T[]) {
    if (models.length == 0) {
      return 0
    }
    const valueBuckets = this.modelsToValueBuckets(models)
    const updatedCount = valueBuckets
      .map(item => {
        const wrapper =
          new RdbPredicatesWrapper(this.targetTable).equalTo(this.idColumnLazy.value,
            item[this.idColumnLazy.value._fieldName] as ValueType)
        return this.rdbStore.updateSync(item, wrapper.rdbPredicates) !=
          -1;
      })
      .filter((item) => {
        return item
      })
      .length
    return updatedCount
  }

  /**
   * 从表中移除内容
   * @param models 要移除的内容
   * @returns 删除的内容行数
   */
  remove(models: T[]) {
    if (models.length == 0) {
      return 0
    }
    const valueBuckets = this.modelsToValueBuckets(models)
    const updatedCount = valueBuckets
      .map(item => {
        const wrapper =
          new RdbPredicatesWrapper(this.targetTable).equalTo(this.idColumnLazy.value,
            item[this.idColumnLazy.value._fieldName] as ValueType)
        return this.rdbStore.deleteSync(wrapper.rdbPredicates) != -1;
      })
      .filter((item) => {
        return item
      })
      .length
    return updatedCount
  }

  /**
   * 根据条件删除表中的内容
   * @param wrapperFunction
   * @returns
   */
  removeIf(wrapperFunction: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T>) {
    const wrapper = wrapperFunction(new RdbPredicatesWrapper(this.targetTable))
    return this.rdbStore.deleteSync(wrapper.rdbPredicates)
  }

  /**
   * 清空表
   * @returns 返回受影响的内容行数
   */
  clear() {
    return this.removeIf((it) => {
      return it
    })
  }

  /**
   * 根据条件查询表中的内容
   * @param wrapperFunction 查询条件表达式
   * @returns 查询到的数据集合
   */
  query(wrapperFunction: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T> = (wrapper) => {
    return wrapper
  }): T[] {
    const wrapper = wrapperFunction(new RdbPredicatesWrapper(this.targetTable))
    return ResultSetUtils.queryToEntity(this.rdbStore, wrapper, this.targetTable)
  }
}

export namespace database {
  export declare let globalDatabase: Database

  export async function close() {
    return globalDatabase!!.close().finally(() => {
      globalDatabase = null
    })
  }

  export function sequenceOf<T>(targetTable: Table<T>) {
    return globalDatabase!!.sequenceOf(targetTable)
  }
}