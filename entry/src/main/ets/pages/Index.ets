import { database } from '@zxhhyj/storm'
import { Book, books } from '../model/Book'
import { Bookcase, bookcases } from '../model/Bookcase'

@Entry
@Component
struct Index {
  @State message: Array<string> = []

  queryDataPrint() {
    for (let queryElement of database.of(bookcases).query()) {
      this.message.push(`bookcase id:${queryElement.id},name:${queryElement.name}`)
    }
    for (let queryElement of database.of(books).query()) {
      this.message.push(`book id:${queryElement.id},name:${queryElement.name},bookcase id:${queryElement.bookcase.id}`)
    }
  }

  startSqlBenchmark() {
    database
      .of(bookcases).clearCount()
    database
      .of(books).clearCount()
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
          book.name = "死在火星上"
        })
        .update(book)
      // database
      //   .of(books)
      //   .beginTransaction((it) => {
      //     it.to(bookcases).add(bookcase)
      //     it.add(book)
      //   })
      const endTime = new Date()
      this.message.push(`运行耗时${endTime.getTime() - startTime.getTime()}`)
      this.queryDataPrint()
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