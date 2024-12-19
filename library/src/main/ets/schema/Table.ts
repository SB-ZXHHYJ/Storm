import { TableMigration } from '../../../../Index';
import { Column, ColumnTypes, IndexColumn } from './Column';

/**
 * 用于提取 Table 的泛型类型
 */
export type ExtractTableModel<T> = T extends Table<infer M> ? M : never

export const UseTableOptions = Symbol('UseOptions')

export abstract class Table<Model> {
  [UseTableOptions]() {
    return this.options
  }

  /**
   * 默认版本号
   */
  public static DEFAULT_TABLE_VERSION = 1

  /**
   * Table 的名称
   */
  abstract readonly tableName: string

  /**
   * Table 的版本号
   */
  readonly targetVersion: number = Table.DEFAULT_TABLE_VERSION

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

  private readonly options = Object.freeze({
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
}