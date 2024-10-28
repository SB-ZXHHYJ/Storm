
## 介绍

HarmonyOS上的SQL DSL库，其设计思想部分来源于[Ktorm](https://www.ktorm.org/zh-cn/)。

目前主要实现了实体类与列绑定、实体查询、实体增删改等。

## 安装

安装库：

```text
ohpm install @zxhhyj/strom
```

## 基本用法

1、定义了表`t_book`，其表结构为`CREATE TABLE IF NOT EXISTS t_book(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE)`
```typescript
class Books extends Table<Book> {
  override tableName = 't_book'
  readonly id = Column.number('id').id(true)
  readonly name = Column.string('name').notNull().unique()
}

export const books = new Books()

@Observed
@SqlTable(books)
export class Book {
  @SqlColumn(books.id)
  declare id?: number;
  @SqlColumn(books.name)
  declare name: string;
}
```
2、初始化db文件，使用`Database.create`来创建`Database`后可以赋值给`database.globalDatabase`，这是库中预留的全局唯一`Database`变量。赋值给`database.globalDatabase`后，可以直接使用`database`下的`close`和`sequenceOf`函数，使用起来更方便。
```typescript
 database.globalDatabase = await Database.create(this.context, {
  name: "app.db",
  securityLevel: relationalStore.SecurityLevel.S1
})
```

3、对`books`进行增删改查。

```typescript
//插入数据
database
  .sequenceOf(books)
  .inserts([{ id: 1, name: "Hello Storm" }])
//.inserts([{ name: "Hello Storm" }]) 也可以不指定id（id为?时可用）
```

```typescript
//更新数据
database
  .sequenceOf(books)
  .update([{ id: 1, name: "你好Storm" }])
```

```typescript
//删除数据
database
  .sequenceOf(books)
  .removeIf((it) => {
    return it.equalTo(books.id, 1)
  })
//在lambda表达式中输入删除的条件
```
`Storm支持`[RdbPredicates](https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates)的全部条件。

4、实体绑定和数据监听还未准备好...

## 交流

如有疑问，请提issues。





