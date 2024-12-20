import { myDatabase } from '../database/AppDatabase'
import { Test } from './Test'

export const AsyncTest: Test = {
  main: async () => {
     myDatabase.beginAsync((it) => {
      it.bookDao.count()
    })
  },
  verify: function (): boolean {
    //似乎只能手动测试
    return true
  },
  name: "AsyncTest"
}
