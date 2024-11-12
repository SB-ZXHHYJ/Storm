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
import { VerUpAndJsonTest } from '../logic/demo/VerUpAndJsonTest'
import { UpdateIfNullTest } from '../logic/demo/UpdateIfNullTest'

@Entry
@ComponentV2
struct Index {
  @Local private works: Test[] =
    [AddTest, RemoveTest, UpdateIfTest, UpdateIfNullTest, UpdateTest, RemoveIfTest, TransactionTest, VerUpAndJsonTest]

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
              .reset()
              .to(books)
              .reset()
            worksElement.main()
            if (!worksElement.verify()) {
              throw new Error(`任务${worksElement.name}测试失败`)
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
    .title('Benchmark')
    .backgroundColor(0xFFF3F1F6)
    .width('100%')
    .height('100%')
  }
}