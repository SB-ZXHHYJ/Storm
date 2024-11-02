import { database } from '@zxhhyj/storm'
import { Book, books } from '../model/Book'
import { Bookcase, bookcases } from '../model/Bookcase'

@Entry
@Component
struct Index {
  @State message: Array<string> = []

  private startSqlBenchmark() {
    database
      .of(bookcases)
      .clear()
      .to(books)
      .clear()
    const bookcase: Bookcase = {
      name: "科幻小说"
    }
    const book: Book = {
      name: "三体",
      bookcase: bookcase
    }
    try {
      const startTime = new Date()
      database
        .of(bookcases)
        .add(bookcase)
        .to(books)
        .add(book)
        .run(() => {
          const addBook = database.of(books).query().find((item => {
            return item.id == book.id
          }))
          if (addBook && addBook.bookcase != undefined) {
            this.message.push(`验证成功，book已成功添加`)
          } else {
            this.message.push(`验证失败，book未删除添加`)
          }
          book.name = "死在火星上"
        })
        .update(book)
        .run(() => {
          const updateBook = database.of(books).query().find((item => {
            return item.id == book.id
          }))
          if (updateBook?.name === "死在火星上") {
            this.message.push(`验证成功，book已成功更新`)
          } else {
            this.message.push(`验证失败，book未成功更新`)
          }
        })
        .beginTransaction(it => {
          it.to(bookcases).remove(bookcase)
          it.remove(book)
        })
        .run(() => {
          const hasBook = database.of(books).query().find((item => {
            return item.id == book.id
          }))
          if (hasBook) {
            this.message.push(`验证失败，book未删除成功`)
          } else {
            this.message.push(`验证成功，book已成功删除`)
          }
        })
      const endTime = new Date()
      this.message.push(`运行耗时${endTime.getTime() - startTime.getTime()}`)
    } catch (e) {
      this.message.push(`${e}`)
    }
  }

  build() {
    Navigation() {
      Column() {
        List() {
          ListItemGroup({ style: ListItemGroupStyle.CARD }) {
            ForEach(this.message, (item: string) => {
              ListItem() {
                Text(item)
              }
            })
          }.backgroundColor(Color.White)
        }
        .width('100%')
        .height(0)
        .layoutWeight(1)

        Button() {
          Text('Start').fontColor(Color.White)
        }
        .onClick(() => {
          this.startSqlBenchmark()
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