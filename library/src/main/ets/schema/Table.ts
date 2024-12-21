import { TableMigration } from '../../../../Index';
import { Column, ColumnTypes, IndexColumn } from './Column';

/**
 * 用于提取 Table 的泛型类型
 */
export type ExtractTableModel<T> = T extends Table<infer M> ? M : never

/**
 * 用于实现"仅模块可见"
 */
export const UseTableOptions = Symbol('UseTableOptions')

export abstract class Table<Model> {
  [UseTableOptions]() {
    return this.options
  }

  /**
   * Table 的名称
   */
  abstract readonly tableName: string

  /**
   * 仅防止编译器认为泛型 Model 没有被使用而将其移除
   */
  protected readonly model: Model

  /**
   * Table 中所有 Column 的数组，但不包括 IndexColumn
   */
  private readonly columns: ColumnTypes[] = []

  /**
   * Table 中被指定为 Id 的 Column 数组
   */
  private readonly idColumns: ColumnTypes[] = []

  /**
   * Table 中所有 IndexColumn 的数组
   */
  private readonly indexColumns: IndexColumn[] = []

  /**
   * 存储这个表的所有迁移操作对象
   */
  private readonly migrations: TableMigration<any>[] = []

  private readonly options: TableOptions = {
    addMigration: function (migration: TableMigration<any>) {
      this.migrations.push(migration)
    },
    migrations: this.migrations,
    addColumn: function (column: ColumnTypes | IndexColumn) {
      if (column instanceof Column) {
        this.columns.push(column)
        if (column.isPrimaryKey) {
          this.idColumns.push(column)
        }
        return
      }
      if (column instanceof IndexColumn) {
        this.indexColumns.push(column)
        return
      }
    },
    columns: this.columns,
    idColumns: this.idColumns,
    indexColumns: this.indexColumns
  }
}

interface TableOptions {
  readonly addMigration: (migration: TableMigration<any>) => void
  readonly migrations: readonly TableMigration<any> []
  readonly addColumn: (column: ColumnTypes | IndexColumn) => void
  readonly columns: readonly ColumnTypes[]
  readonly idColumns: readonly ColumnTypes[]
  readonly indexColumns: readonly IndexColumn[]
}