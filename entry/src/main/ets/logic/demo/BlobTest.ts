import { database } from '@zxhhyj/storm'
import { Blob, blobs } from '../model/Blob'
import { Test } from './Test'

export const BlobTest: Test = {
  main: () => {
    const blob: Blob = {
      photo: new Uint8Array([10, 20, 30, 40]),
      createDataTime: new Date()
    }
    database
      .of(blobs)
      .add(blob)
  },
  verify: function (): boolean {
    return database.of(blobs)
      .query()
      .first()
      .photo
      .toString() === "10,20,30,40"
  },
  name: "BlobTest"
}
