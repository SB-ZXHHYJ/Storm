import { Migration } from '../database/Migration';
import { Table, UseMigrations } from '../schema/Table';

type Constructor<T> = new (...args: any[]) => T

export namespace Storm {
  export function databaseBuilder() {

  }

  export function tableBuilder<T extends Table<any>>(tableConstructor: Constructor<T>) {
    return new TableBuilder(tableConstructor)
  }
}

class DatabaseBuilder {
}

class TableBuilder<T extends Table<any>> {
  private migrations: Migration<T>[] = null

  constructor(private readonly tableConstructor: Constructor<T>) {
  }

  addMigration(migration: Migration<T>): this {
    if (!this.migrations) {
      this.migrations = []
    }
    this.migrations.push(migration)
    return this
  }

  build() {
    const instance = new this.tableConstructor()
    if (this.migrations && this.migrations.length > 0) {
      const useMigrations = instance[UseMigrations]()
      for (const element of this.migrations) {
        useMigrations.addMigration(element)
      }
    }
    return instance
  }
}