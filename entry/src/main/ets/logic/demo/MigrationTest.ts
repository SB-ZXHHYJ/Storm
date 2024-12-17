import { database } from '@zxhhyj/storm'
import { bookcases, bookcasesMigration_1_2 } from '../model/Bookcase'
import { Test } from './Test'

export const MigrationTest: Test = {
  main: () => {
    database.globalDatabase.open(bookcases)
  },
  verify: function (): boolean {
    return true
  },
  name: "AddTest"
}
