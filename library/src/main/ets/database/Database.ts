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

export class Database {
  private rdbStore: relationalStore.RdbStore

  private constructor(rdbStore: relationalStore.RdbStore) {
    this.rdbStore = rdbStore
  }

  async close(): Promise<void> {
    return this.rdbStore.close()
  }

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

  constructor(rdbStore: relationalStore.RdbStore, targetTable: Table<T>) {
    this.rdbStore = rdbStore
    this.targetTable = targetTable
  }

  private modelsToValueBuckets(models: any[]) {
    const valueBuckets = models.map((value) => {
      const valueBucket: relationalStore.ValuesBucket = {};
      for (const keysElement of Object.keys(value)) {
        const currentValue = value[keysElement];
        const column = getSqlColumn(this.targetTable.entityPrototype.prototype, keysElement);
        if (column) {
          if (column.entityPrototype) {
            const subTable = getSqlTable(column.entityPrototype);
            if (subTable) {
              const idColumn = Object.values(subTable).find((item) => item instanceof Column && item.isPrimaryKey);
              if (idColumn) {
                // 从插入的数据里获取id
                const itemId = currentValue[idColumn.fieldName];
                if (itemId) {
                  valueBucket[column.fieldName] = itemId;
                  continue;
                }
              }
            }
          }
          valueBucket[column.fieldName] = currentValue;
        }
      }
      return valueBucket;
    });
    return valueBuckets
  }

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

    // 获取主键列
    const idColumn: Column<any> =
      Object.values(this.targetTable).find((item) => item instanceof Column && item.isPrimaryKey);
    if (idColumn) {
      // 更新每个值桶中的主键字段
      valueBuckets.forEach((valueBucket) => {
        if (valueBucket[idColumn.fieldName] == null) {
          // 获取表对应的最新自增id
          const sqlSequence = sqlSequenceQuery.find((value) => value.name === this.targetTable.tableName);
          if (sqlSequence) {
            valueBucket[idColumn.fieldName] = sqlSequence.seq += 1;
          } else {
            // 如果没有找到序列，则创建一个新的序列
            const newSqlSequence: SqliteSequence = { name: this.targetTable.tableName, seq: 1 };
            sqlSequenceQuery.push(newSqlSequence);
            valueBucket[idColumn.fieldName] = newSqlSequence.seq;
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

  update(models: T[]) {
    if (models.length == 0) {
      return 0
    }
    const idColumn: Column<any> =
      Object.values(this.targetTable).find((item) => item instanceof Column && item.isPrimaryKey);
    const valueBuckets = this.modelsToValueBuckets(models)
    const updatedCount = valueBuckets
      .map(item => {
        const wrapper =
          new RdbPredicatesWrapper(this.targetTable).equalTo(idColumn, item[idColumn.fieldName] as ValueType)
        return this.rdbStore.updateSync(item, wrapper.rdbPredicates) !=
          -1;
      })
      .filter((item) => {
        return item
      })
      .length
    return updatedCount
  }

  removeIf(wrapperFunction: (wrapper: RdbPredicatesWrapper<T>) => RdbPredicatesWrapper<T>) {
    const wrapper = wrapperFunction(new RdbPredicatesWrapper(this.targetTable))
    return this.rdbStore.deleteSync(wrapper.rdbPredicates)
  }

  /**
   *
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
  export let globalDatabase: Database | undefined

  export async function close() {
    return globalDatabase!!.close().finally(() => {
      globalDatabase = undefined
    })
  }

  export function sequenceOf<T>(targetTable: Table<T>) {
    return globalDatabase!!.sequenceOf(targetTable)
  }

}