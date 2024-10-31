import { database } from '@zxhhyj/storm';
import { Bookcase, bookcases } from '../model/Bookcase';

@Entry
@Component
struct Index {
  @State message: Array<string> = []

  queryDataPrint() {
    for (let queryElement of database.sequenceOf(bookcases).query()) {
      this.message.push(`bookcase id:${queryElement.id},name:${queryElement.name}`)
    }
  }

  startSqlBenchmark() {
    const bookcaseList: Array<Bookcase> = [
      {
        name: "《百年孤独》"
      }]
    try {
      const startTime = new Date();
      database
        .sequenceOf(bookcases)
        .beginTransaction((it) => {
          it.inserts(bookcaseList)
          bookcaseList[0].name = "三体"
          it.update(bookcaseList)
        })
      const endTime = new Date();
      this.message.push(`运行耗时${endTime.getTime() - startTime.getTime()}`)
      this.queryDataPrint()
      database
        .sequenceOf(bookcases).clear()
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