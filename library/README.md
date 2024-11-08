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

### 初始化数据库

使用 `Database.create` 方法来创建数据库实例后，可以将其赋值给 `database.globalDatabase`。这是库中预留的全局唯一 `Database`
变量。赋值后，可以更方便地使用 `database` 下的 `close` 和 `of` 函数。

```typescript
database.globalDatabase = await Database.create(this.context, {
  name: "app.db",
  securityLevel: relationalStore.SecurityLevel.S1
});
```

### 定义表结构

#### 1.定义 Bookcase 类

`Bookcase` 类表示一个书籍集合。其定义如下：

- **表名**：`t_bookcase`
- **字段**：
  - `id`：整数，主键，自动递增。
  - `name`：文本，必须唯一且不能为空。

```typescript
class Bookcases extends Table<Bookcase> {
  override tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true)
  readonly name = Column.text('name').notNull().unique()
}

export const bookcases = new Bookcases()

@SqlTable(bookcases)
export class Bookcase {
  @SqlColumn(bookcases.id)
  id?: number
  @SqlColumn(bookcases.name)
  name: string
}
```

#### 2.定义 Book 类

`Book` 类表示存储在书架上的单个书籍。其包含以下属性：

- **表名**：`t_book`
- **字段**：
  - `id`: 整数，主键，自动递增。
  - `name`: 文本，必须唯一。
  - `bookcase`: 对 `Bookcase` 的实体引用。
  - `createDataTime`: 日期，表示书籍的创建时间戳。

```typescript
class Books extends Table<Book> {
  override tableName = 't_book'
  readonly bookcase = Column.entity('bookcase_id', Bookcase)
  readonly id = Column.integer('id').primaryKey(true)
  readonly name = Column.text('name').unique()
  readonly createDataTime = Column.date("create_data_time")
}

export const books = new Books()

@SqlTable(books)
export class Book {
  @SqlColumn(books.id)
  id?: number
  @SqlColumn(books.name)
  name: string
  @SqlColumn(books.bookcase)
  bookcase: Bookcase
  @SqlColumn(books.createDataTime)
  createDataTime?: Date
}
```

### 增删改查

#### 1.添加数据

**先使用`of`和`to`来确定要操作的表**，然后使用 `add` 方法将数据添加到数据库中

```typescript
const bookcase: Bookcase = {
  name: "科幻小说"
}
const book: Book = {
  name: "三体",
  bookcase: bookcase
}
database
  .of(bookcases)
  .add(bookcase)//添加数据
  .to(books)
  .add(book) //添加数据
```

#### 2.更新数据

使用`update`将数据库中的数据更新，使用`update`需要数据中存在主键，否则更新失败

```typescript
const bookcase: Bookcase = {
  name: "科幻小说"
}
database
  .of(bookcases)
  .add(bookcase)
  .run(() => {
    bookcase.name = "女生小说" //修改name
  })
  .update(bookcase) //更新数据
```

如果不知道主键或想实现更精细化的操作需要使用`updateIf`

```typescript
const bookcase: Bookcase = {
  name: "科幻小说"
}
database
  .of(bookcases)
  .add(bookcase)
  .updateIf(it => it.equalTo(bookcases.id, bookcase.id), [[bookcases.name, "女生小说"]]) //指定更新某一项
```

#### 3.删除数据

使用`remove`将数据库中的数据更新，使用`remove`需要数据中存在主键，否则更新失败

```typescript
const bookcase: Bookcase = {
  name: "科幻小说"
}
database
  .of(bookcases)
  .add(bookcase)
  .remove(bookcase) //移除数据
```

如果不知道主键或想实现更精细化的操作需要使用`removeIf`

```typescript
const bookcase: Bookcase = {
  name: "科幻小说"
}
database
  .of(bookcases)
  .add(bookcase)
  .removeIf(it => it.equalTo(bookcases.name, "科幻小说")) //指定条件来删除数据
```

#### 4.使用事务

使用`beginTransaction`来开启一个事务

```typescript
try {
  const bookcase: Bookcase = {
    name: "科幻小说"
  }
  database
    .of(bookcases)
    .add(bookcase)
    .beginTransaction(it => {
      //在这个lambda中对数据库的操作都属于同一个事务
      bookcase.name = "女生小说"
      it.update(bookcase)
      throw new Error('强制停止') //强制停止
    })
} catch (e) {
  //在此查询数据已验证事务是否生效
}
```

### 查询数据

查询条件可以参考官方的[relationalStore.RdbPredicates](https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates)

```typescript
for (const queryElement of database.of(books).query()) {
  ...
}
for (const queryElement of database.of(books).query(it => it.it.equalTo(bookcases.name, "科幻小说"))) {
  ...
}
```

### 更新数据库

等待补充...

## 路线图

|        路线         | 期望版本 | 状态  |
|:-----------------:|:----:|:---:|
|  实现具有强类型的数据库更新逻辑  | 1.3+ | 未完成 |
| 对象模型与SQL模型的互转逻辑解耦 | 1.3+ | 未完成 |

## 交流

如有疑问，请提`issues`或者致信到我的邮箱`957447668@qq.com`。