import { AddTest } from '../logic/demo/AddTest'
import { RemoveTest } from '../logic/demo/RemoveTest'
import { Test } from '../logic/demo/Test'
import { UpdateIfTest } from '../logic/demo/UpdateIfTest'
import { UpdateTest } from '../logic/demo/UpdateTest'
import { promptAction } from '@kit.ArkUI'
import { TransactionTest } from '../logic/demo/TransactionTest'
import { RemoveIfTest } from '../logic/demo/RemoveIfTest'
import { UpdateIfNullTest } from '../logic/demo/UpdateIfNullTest'
import { BlobTest } from '../logic/demo/BlobTest'
import { OtherTest } from '../logic/demo/OtherTest'
import { IndexTest } from '../logic/demo/IndexTest'
import { myDatabase } from '../logic/database/AppDatabase'
import { AsyncTest } from '../logic/demo/AsyncTest'

@Entry
@ComponentV2
struct Index {
  @Local private works: Test[] =
    [
      AddTest,
      RemoveTest,
      UpdateIfTest,
      UpdateIfNullTest,
      UpdateTest,
      RemoveIfTest,
      TransactionTest,
      BlobTest,
      IndexTest,
      OtherTest,
      AsyncTest
    ]

  build() {
    Navigation() {
      Stack() {
        Button() {
          Text('Start').fontColor(Color.White)
        }
        .align(Alignment.Center)
        .onClick(() => {
          for (const worksElement of this.works) {
            myDatabase.bookcaseDao.removeIf(it => it)
            myDatabase.bookDao.removeIf(it => it)
            myDatabase.blobDao.removeIf(it => it)
            worksElement.main()
            if (!worksElement.verify()) {
              //throw Error(`任务${worksElement.name}测试失败`)
              promptAction.showToast({ message: `任务${worksElement.name}测试不通过` })
              return
            }
          }
          promptAction.showToast({ message: "全部任务验证通过" })
        })
        .height(42)
        .width(64)
      }
      .width('100%')
      .height('100%')
    }
    .title('标准测试流程')
    .backgroundColor(0xFFF3F1F6)
    .width('100%')
    .height('100%')
  }
}