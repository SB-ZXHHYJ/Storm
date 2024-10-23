import { database } from '@zxhhyj/storm';
import { Bookcase, bookcases } from '../model/Bookcase';

@Entry
@Component
struct Index {
  @State message: Array<string> = []

  aboutToAppear() {
    for (let queryElement of database.sequenceOf(bookcases).query()) {
      this.message.push(`bookcase id:${queryElement.id},name:${queryElement.name}`)
    }
  }

  startSqlBenchmark() {
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
      }]
    try {
      database
        .sequenceOf(bookcases)
        .beginTransaction((it) => {
          it.inserts(bookcaseList)
          it.update([{ id: 1, name: "我的世界" }])
        })
    } catch (e) {
      this.message.push(`${e}`)
    }

    this.message.push(`bookcase size:${database.sequenceOf(bookcases).query().length}`)
    for (let queryElement of database.sequenceOf(bookcases).query()) {
      this.message.push(`bookcase id:${queryElement.id},name:${queryElement.name}`)
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