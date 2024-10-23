import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from '@ohos/hypium';
import { database, Database } from '@zxhhyj/storm';
import { relationalStore } from '@kit.ArkData';
import { Bookcase, bookcases } from '../main/ets/model/Bookcase';

export default function localUnitTest() {
  describe('localUnitTest', () => {
    // Defines a test suite. Two parameters are supported: test suite name and test suite function.
    beforeAll(() => {
      // Presets an action, which is performed only once before all test cases of the test suite start.
      // This API supports only one parameter: preset action function.
    });
    beforeEach(() => {
      // Presets an action, which is performed before each unit test case starts.
      // The number of execution times is the same as the number of test cases defined by **it**.
      // This API supports only one parameter: preset action function.
    });
    afterEach(() => {
      // Presets a clear action, which is performed after each unit test case ends.
      // The number of execution times is the same as the number of test cases defined by **it**.
      // This API supports only one parameter: clear action function.
    });
    afterAll(() => {
      // Presets a clear action, which is performed after all test cases of the test suite end.
      // This API supports only one parameter: clear action function.
    });
    it('testPreferences', 0, async () => {
      database.globalDatabase = await Database.create(getContext(), {
        name: "app.db",
        securityLevel: relationalStore.SecurityLevel.S1
      })
      const bookcaseList: Array<Bookcase> = [
        {
          name: "《百年孤独》"
        },
        {
          name: "《三体》"
        },
        {
          name: "《番茄工作法》"
        },
        {
          name: "《西方哲学史》"
        },
        {
          name: "《爱因斯坦传》"
        }]
      database.sequenceOf(bookcases).inserts(bookcaseList)
      console.info(`bookcase size:${database.sequenceOf(bookcases).query().length}`)
    })
  }
  )
}