import { myDatabase } from '../database/AppDatabase'
import { Blob } from '../model/Blob'
import { Test } from './Test'

/**
 * @todo 不是很规范，但暂时想不到更好的办法
 */
export const BlobTest: Test = {
  main: () => {
    const blob: Blob = {
      photo: new Uint8Array([10, 20, 30, 40]),
      createDataTime: new Date()
    }
    myDatabase.blobDao.add(blob)
  },
  verify: function (): boolean {
    return myDatabase.blobDao
      .first()
      .photo
      .toString() === "10,20,30,40"
  },
  name: "BlobTest"
}