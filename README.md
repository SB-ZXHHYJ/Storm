## 介绍

Storm 是直接基于纯 `TypeScript` 编写的高效简洁的轻量级 `OpenHarmonyOS SQL ORM` 框架，它提供了`强类型`而且灵活的 SQL
DSL，并且所有的 SQL 都是自动生成的。

其部分设计思想来源于[Ktorm](https://www.ktorm.org/zh-cn/)。

## 安装

安装库：

```text
ohpm install @zxhhyj/storm
```

## 基本用法

创建一个`class`继承`Table`来描述表的结构，并创建这个表的唯一对象并导出。
重写`Table`中的`tableName`来确定表的名称，
之后在表中定义属性并使用`Column.number()`、`Column.string()`
等api来描述这个表的结构，同时可以链式使用`primaryKey()`、`notNull()`、`unique()`等api来设置主键、不可空、不可重复等。
1.创建书架`Bookcases`的`Table`，并描述它的表名和结构。

```typescript
//step.1
class Bookcases extends Table<Bookcase> {
  override tableName = 't_bookcase'
  readonly id = Column.number('id').primaryKey(true)
  readonly name = Column.string('name').notNull().unique()
}

//step.2
export const bookcases = new Bookcases()

//step.3
@SqlTable(bookcases)
export class Bookcase {
  @SqlColumn(bookcases.id)
  id?: number
  @SqlColumn(bookcases.name)
  name: string
}
```

2.创建书本`Book`的`Table`，并描述它的表名和结构。值得注意的是`Book`的`Table`和类中都有一个属性`bookcase`，这是`Storm`
的列绑定功能，需要在`Table`中使用`Column.entity('xxxx_id', xxxx)`，`Storm`会自动将`xxxx`类型的主键存储到`xxxx_id`
中，在查询数据时，`Storm`也会自动帮你查询并填充好。

```typescript
//step.1
class Books extends Table<Book> {
  override tableName = 't_book'
  readonly bookcase = Column.entity('bookcase_id', Bookcase)
  readonly id = Column.number('id').primaryKey(true)
  readonly name = Column.string('name').notNull().unique()
}

//step.2
export const books = new Books()

//step.3
@SqlTable(books)
export class Book {
  @SqlColumn(books.id)
  id?: number
  @SqlColumn(books.name)
  name: string
  @SqlColumn(books.bookcase)
  bookcase: Bookcase
}
```

3、初始化数据库，使用`Database.create`来创建`Database`后可以赋值给`database.globalDatabase`
，这是库中预留的全局唯一`Database`变量。赋值给`database.globalDatabase`后，可以直接使用`database`下的`close`和`sequenceOf`
函数，使用起来更方便。

```typescript
 database.globalDatabase = await Database.create(this.context, {
  name: "app.db",
  securityLevel: relationalStore.SecurityLevel.S1
})
```

4、增删改查。

4.1、增加数据和修改数据。

```typescript
//bookcase
const bookcase: Bookcase = {
  name: "科幻小说"
}
//book
const book: Book = {
  name: "三体",
  bookcase: bookcase
}
database
  .of(bookcases)//of函数需要一个Table参数，表示此次要操作的表
  .add(bookcase)//添加bookcase到数据库中
  .to(books)//to函数需要一个Table参数，表示此次要切换操作的表
  .add(book)//添加book到数据库中
  .run(() => {
    //run函数用于在链式调用中途想执行一些逻辑时使用
    book.name = "死在火星上"
    //这里我们修改了book的name
  })
  .update(book) //更新book
```

4.2、删除数据。

```typescript
//删除数据
database
  .of(books)
  .remove(xxx)
//xxx为要删除的数据
```

4.3、查询数据。

```typescript
//查询数据
for (let queryElement of database.of(books).query()) {
  //xxx
}
//没有条件就是遍历所有数据
for (let queryElement of database.of(books).query(it, table => {
  return it.equalTo(table.id, 1)
})) {
  //xxx
}
//查询id为1的数据并遍历
```

4.4、使用事务。

```typescript
//使用事务
database
  .of(books)
  .beginTransaction(it => {
    it.add(xxx)
    it.update(xxx)
    //...
    //在这个lambda里进行操作
  })
```

## 交流

如有疑问，请提issues。