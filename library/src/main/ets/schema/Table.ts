import { Migration } from '../../../../Index';
import { Column, ColumnTypes, IndexColumn } from './Column';

export const UseMigrations = Symbol('UseMigrations')

export const UseColumns = Symbol('UseColumns')

export abstract class Table<Model> {
  [UseMigrations]() {
    return this.useMigrations
  }

  [UseColumns]() {
    return this.useColumns
  }

  private addMigration(migration: Migration<any>) {
    this.migrations.push(migration)
  }

  private addColumn(column: ColumnTypes | IndexColumn) {
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
   *
   */
  private readonly migrations: Migration<this>[] = []

  private readonly useMigrations: UseMigrations = {
    addMigration: this.addMigration,
    migrations: this.migrations as readonly Migration<any>[]
  }

  private readonly useColumns: UseColumn = {
    addColumn: this.addColumn,
    columns: this.columns as readonly ColumnTypes[],
    idColumns: this.idColumns as readonly ColumnTypes[],
    indexColumns: this.indexColumns as readonly IndexColumn[]
  }
}

interface UseMigrations {
  readonly addMigration: (migration: Migration<any>) => void
  readonly migrations: readonly Migration<any>[]
}

interface UseColumn {
  readonly  addColumn: (column: ColumnTypes | IndexColumn) => void
  readonly columns: readonly ColumnTypes[]
  readonly idColumns: readonly ColumnTypes[]
  readonly indexColumns: readonly IndexColumn[]
}