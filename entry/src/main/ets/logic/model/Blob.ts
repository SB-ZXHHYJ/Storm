import { Column, Table } from '@zxhhyj/storm';

class BlobTable extends Table<Blob> {
  readonly tableName = 't_blob'

  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')

  readonly photo = Column.blob('photo').bindTo(this, 'photo')

  readonly createDataTime =
    Column.date('create_data_time').default(new Date().toString()).bindTo(this, 'createDataTime')
}

export const TableBlob = new BlobTable()

export interface Blob {
  id?: number
  photo: Uint8Array
  createDataTime: Date
}