import { database } from '@zxhhyj/storm'
import { NewBookcase, newVerBookcase } from '../model/NewVerBookcase'
import { Test } from './Test'

export const VersionUpTest: Test = {
  main: () => {
    const bookcase: NewBookcase = {
      name: "科幻小说"
    }
    database
      .of(newVerBookcase)
      .add(bookcase)
    //调用Table初次调用of或者to时都会进行版本升级
  },
  verify: function (): boolean {
    const bookcase = database.of(newVerBookcase).query(it => it.groupBy([newVerBookcase.createDataTime]))[0]
    return bookcase.createDataTime instanceof Date
  },
  name: "VersionUpTest"
}
