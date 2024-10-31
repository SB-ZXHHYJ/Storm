
## 介绍

Storm 是直接基于纯 `TypeScript` 编写的高效简洁的轻量级 `OpenHarmonyOS SQL ORM` 框架，它提供了`强类型`而且灵活的 SQL DSL，并且所有的 SQL 都是自动生成的。

HarmonyOS上的SQL DSL库，其设计思想部分来源于[Ktorm](https://www.ktorm.org/zh-cn/)。

## 安装

安装库：

```text
ohpm install @zxhhyj/storm
```

## 基本用法
1、使用`Table`来描述表的结构，创建这个表的唯一对象并导出。重写`Table`中的`tableName`来确定表的名称，之后在表中定义属性（`readonly`）并使用`Column.number`、`Column.string`等Api来描述这个表的结构。
如下示例中所创建的SQL结构为`t_book(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE)`。
```typescript
class Books extends Table<Book> {
  override tableName = 't_book'
  readonly id = Column.number('id').id(true)
  readonly name = Column.string('name').notNull().unique()
}

export const books = new Books()
```
2、描述实体类（目前必须描述实体类）。
注意实体类必须使用`@SqlTable()`注解来指向第一个步骤的`export const books = new Books()`常量，然后在类定义这个实体的属性，其格式为`declare 属性名称: 属性的类型`，如果这个熟悉可空则可以使用`?`来修饰，其格式为`declare 属性名称?: 属性的类型`，最后为这些属性添加`@SqlColumn()`注解来指向对应`Table`中的属性。
```typescript
class Books extends Table<Book> {
  override tableName = 't_book'
  readonly id = Column.number('id').id(true)
  readonly name = Column.string('name').notNull().unique()
}

export const books = new Books()

@SqlTable(books)
export class Book {
  @SqlColumn(books.id)
  declare id?: number
  @SqlColumn(books.name)
  declare name: string
}
```
3、初始化数据库，使用`Database.create`来创建`Database`后可以赋值给`database.globalDatabase`，这是库中预留的全局唯一`Database`变量。赋值给`database.globalDatabase`后，可以直接使用`database`下的`close`和`sequenceOf`函数，使用起来更方便。
```typescript
 database.globalDatabase = await Database.create(this.context, {
  name: "app.db",
  securityLevel: relationalStore.SecurityLevel.S1
})
```

4、对`books`进行增删改查。

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
  .remove([{ id: 1, name: "Hello Storm" }]) 
// .removeIf((it) => {
//   return it.equalTo(books.id, 1)
// })
//在lambda表达式中输入删除的条件
```
`Storm支持`[RdbPredicates](https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates)的全部条件。

4、实体的列绑定和数据监听的文档还未准备好...

## 交流

如有疑问，请提issues。