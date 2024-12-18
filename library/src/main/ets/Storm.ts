import { DatabaseDao } from './database/DatabaseDao';
import { Migration } from './database/Migration';
import { Table, UseMigrations } from './schema/Table';
import { Context } from '@kit.AbilityKit';
import { Database } from './schema/Database';
import { relationalStore } from '@kit.ArkData';

type Constructor<T> = new (...args: any[]) => T

type GenerateDaoTypes<T extends Record<string, any>> = {
  [K in keyof T as T[K] extends Table<any> ? K : never]: DatabaseDao<T[K]>
} & {
  rdbStore: relationalStore.RdbStore,
  init: (context: Context) => Promise<void>,
  beginTransaction: (scope: ((it: GenerateDaoTypes<T>) => void)) => void,
  beginAsync: (scope: ((it: GenerateDaoTypes<T>) => void)) => Promise<void>,
}

export namespace Storm {
  export function databaseBuilder<T extends Database>(databaseConstructor: Constructor<T>) {
    return new DatabaseBuilder(databaseConstructor)
  }

  export function tableBuilder<T extends Table<any>>(tableConstructor: Constructor<T>) {
    return new TableBuilder(tableConstructor)
  }
}

class DatabaseBuilder<T extends Database> {
  constructor(private readonly databaseConstructor: Constructor<T>) {
  }

  build() {
    const database = new this.databaseConstructor()
    const instance = {} as GenerateDaoTypes<T>
    instance.init = async function (context: Context) {
      const rdbStore = await database.initDb(context)
      instance.rdbStore = rdbStore
      instance.beginTransaction = function (scope) {
        try {
          rdbStore.beginTransaction()
          scope(instance)
          rdbStore.commit()
        } catch (e) {
          rdbStore.rollBack()
          throw e
        }
      }
      instance.beginAsync = function (scope) {
        return new Promise((resolve) => {
          resolve(scope(instance))
        })
      }
      for (const element of Object.entries(database)) {
        const [key, value] = element
        if (value instanceof Table) {
          instance[key] = new DatabaseDao(rdbStore, value)
        }
      }
      instance.init = null
      Object.freeze(instance)
    }
    return instance
  }
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