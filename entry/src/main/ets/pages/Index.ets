import { database } from '@zxhhyj/storm'
import { AddTest } from '../logic/demo/AddTest'
import { RemoveTest } from '../logic/demo/RemoveTest'
import { Test } from '../logic/demo/Test'
import { UpdateIfTest } from '../logic/demo/UpdateIfTest'
import { UpdateTest } from '../logic/demo/UpdateTest'
import { books } from '../logic/model/Book'
import { bookcases } from '../logic/model/Bookcase'
import { promptAction } from '@kit.ArkUI'
import { TransactionTest } from '../logic/demo/TransactionTest'
import { RemoveIfTest } from '../logic/demo/RemoveIfTest'
import { UpdateIfNullTest } from '../logic/demo/UpdateIfNullTest'
import { BlobTest } from '../logic/demo/BlobTest'

@Entry
@ComponentV2
struct Index {
  @Local private works: Test[] =
    [AddTest, RemoveTest, UpdateIfTest, UpdateIfNullTest, UpdateTest, RemoveIfTest, TransactionTest, BlobTest]

  build() {
    Navigation() {
      Stack() {
        Button() {
          Text('Start').fontColor(Color.White)
        }
        .align(Alignment.Center)
        .onClick(() => {
          for (const worksElement of this.works) {
            database
              .of(bookcases)
              .delete()
              .to(books)
              .delete()
            worksElement.main()
            if (!worksElement.verify()) {
              //throw Error(`任务${worksElement.name}测试失败`)
              promptAction.showToast({ message: `任务${worksElement.name}测试不通过` })
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