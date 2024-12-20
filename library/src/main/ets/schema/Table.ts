import { TableMigration } from '../../../../Index';
import { Column, ColumnTypes, IndexColumn } from './Column';

/**
 * 用于提取 Table 的泛型类型
 */
export type ExtractTableModel<T> = T extends Table<infer M> ? M : never

export const UseTableOptions = Symbol('UseOptions')

export abstract class Table<Model> {
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
  private readonly migrations: TableMigration<this>[] = []

  private readonly options: TableOptions = Object.freeze({
    addMigration: this.registerMigration,
    migrations: this.migrations,
    addColumn: this.registerColumn,
    columns: this.columns,
    idColumns: this.idColumns,
    indexColumns: this.indexColumns
  })

  private registerMigration(migration: TableMigration<any>) {
    this.migrations.push(migration)
  }

  private registerColumn(column: ColumnTypes | IndexColumn) {
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
  }

  [UseTableOptions]() {
    return this.options
  }
}

interface TableOptions {
  // readonly setCreateFormStorm: (value: boolean) => void
  // readonly createFormStorm: boolean
  readonly addMigration: (migration: TableMigration<any>) => void
  readonly migrations: readonly TableMigration<any> []
  readonly addColumn: (column: ColumnTypes | IndexColumn) => void
  readonly columns: readonly ColumnTypes[]
  readonly idColumns: readonly ColumnTypes[]
  readonly indexColumns: readonly IndexColumn[]
}