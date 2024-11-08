import { database } from '@zxhhyj/storm'
import { AddTest } from '../demo/AddTest'
import { RemoveTest } from '../demo/RemoveTest'
import { Test } from '../demo/Test'
import { UpdateIfTest } from '../demo/UpdateIfTest'
import { UpdateTest } from '../demo/UpdateTest'
import { books } from '../model/Book'
import { bookcases } from '../model/Bookcase'
import { promptAction } from '@kit.ArkUI'
import { TransactionTest } from '../demo/TransactionTest'

@Entry
@ComponentV2
struct Index {
  @Local private works: Test[] = [AddTest, RemoveTest, UpdateIfTest, UpdateTest, TransactionTest]

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