## 介绍

Storm是直接基于纯`TypeScript`编写的高效简洁的轻量级`OpenHarmonyOS SQL ORM`框架，提供了`强类型`的`SQL DSL`
，直接将低级bug暴露在编译期，并且所有的`SQL`都是自动生成的，你不需要写任何`SQL`，`Storm`会帮你处理好一切。

其部分设计思想来源于[Ktorm](https://www.ktorm.org/zh-cn/)。

## 安装

在命令行中执行以下命令。

```text
ohpm install @zxhhyj/storm
```

## 基本用法

### 初始化数据库

使用`Database.create()`函数来创建数据库实例后，可以将其赋值给`database.globalDatabase`这是库中预留的全局唯一`Database`
变量，当然，你也可用自己手动定义一个全局`Database`，我们建议在`AbilityStage`创建时初始化`Database`。

```typescript
import { AbilityStage, Want } from '@kit.AbilityKit';
import { database, Database } from '@zxhhyj/storm';
import { relationalStore } from '@kit.ArkData';

export default class AppAbilityStage extends AbilityStage {
  async onCreate() {
    database.globalDatabase = Database.create(await relationalStore.getRdbStore(this.context, {
      name: "app.db", securityLevel: relationalStore.SecurityLevel.S1
    }))
  }

  onAcceptWant(_want: Want): string {
    return 'AppAbilityStage';
  }
}
```

`Database.create()`函数接收一个`relationalStore.RdbStore`实例，你可以与其他`SQL`
框架共享同一个实例，使其共同工作或者逐步替代之前的`SQL`框架。

### 定义表结构

#### 1.定义 Bookcase 类

```typescript
import { Column, SqlColumn, Table } from '@zxhhyj/storm'

class Bookcases extends Table<Bookcase> {
  override readonly tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').notNull().unique().bindTo(this, 'name')
}

export const bookcases = new Bookcases()

export declare class Bookcase {
  id?: number
  name: string
}
```

`Storm`将会生成以下的SQL语句：

```text
CREATE TABLE IF NOT EXISTS t_bookcase(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE)
```

#### 2.定义 Book 类

```typescript
import { Column, SqlColumn, Table } from '@zxhhyj/storm'

class Books extends Table<Book> {
  override readonly tableName = 't_book'
  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').unique().bindTo(this, 'name')
  readonly bookcase = Column.references('bookcase_id', bookcases).bindTo(this, 'bookcase')
  readonly createDataTime =
    Column.date('create_data_time').default(new Date().toString()).bindTo(this, 'createDataTime')
}

export const books = new Books()

export declare class Book {
  id?: number
  name: string
  bookcase: Bookcase
  createDataTime: Date
}
```

其中`bookcase`和`createDataTime`比较特殊：

- **`bookcase`**：
  - 列名：`bookcase_id`；
  - 实际类型：`INTEGER`类型`；
  - 存储：将`Bookcase`的**主键**进行存储；
  - 读取：根据存储的**主键**在`bookcases`表中查询实体并填充；
- **`createDataTime`**:
  - 列名：`create_data_time`；
  - 实际类型：`TEXT`类型；
  - 存储：使用内置的`DateTypeConverters`将`Date`转换为`string`类型存储；
  - 读取：使用内置的`DateTypeConverters`将读出的`string`来恢复为`Date`；

`Storm`将会生成以下的SQL语句：

```text
CREATE TABLE IF NOT EXISTS t_book(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE,bookcase_id INTEGER,create_data_time TEXT DEFAULT 'Tue Nov 12 2024 19:25:15 GMT+0800')
```

### 增删改查

#### 1.添加数据

**先使用`of`来确定要操作的表，后续可以使用`to`来切换要操作的表**，然后使用`add`方法将数据添加到数据库中。

```typescript
import { database } from '@zxhhyj/storm'

const bookcase: Bookcase = {
  name: "科幻小说"
}
const book: Book = {
  name: "三体",
  bookcase: bookcase
}
database
  .of(bookcases)
  .add(bookcase)//添加数据，添加成功后会将自增id填充到bookcase.id中
  .to(books)
  .add(book) //添加数据，添加成功后会将自增id填充到book.id中
```

#### 2.更新数据

使用`update`将数据库中的数据更新，使用`update`需要数据中存在主键，否则更新失败。

```typescript
import { database } from '@zxhhyj/storm'

const bookcase: Bookcase = {
  name: "科幻小说"
}
database
  .of(bookcases)
  .add(bookcase)
  .run(() => {
    bookcase.name = "女生小说" //修改name
  })
  .update(bookcase) //将修改后的name更新到数据库中
```

如果不知道主键或想实现更精细化的操作需要使用`updateIf`。

```typescript
import { database } from '@zxhhyj/storm'

const bookcase: Bookcase = {
  name: "科幻小说"
}
const book: Book = {
  name: "三体",
  bookcase: bookcase,
  createDataTime: new Date()
}
database
  .of(bookcases)
  .add(bookcase)//添加数据，添加成功后会将自增id填充到bookcase.id中
  .to(books)
  .add(book)//添加数据，添加成功后会将自增id填充到book.id中
  .updateIf(it => it.equalTo(books.id, book.id),
    [[books.name, null]]) //将这一列的内容删掉，如果使用常规的update更新，你需要满足类型检查，这样的操作可以避免类型检查
```

#### 3.删除数据

使用`remove`将数据库中的数据更新，使用`remove`需要数据中存在主键，否则更新失败。

```typescript
import { database } from '@zxhhyj/storm'

const bookcase: Bookcase = {
  name: "科幻小说"
}
database
  .of(bookcases)
  .add(bookcase)
  .remove(bookcase) //移除数据
```

如果不知道主键或想实现更精细化的操作需要使用`removeIf`。

```typescript
import { database } from '@zxhhyj/storm'

const bookcase: Bookcase = {
  name: "科幻小说"
}
database
  .of(bookcases)
  .add(bookcase)
  .removeIf(it => it.equalTo(bookcases.name, "科幻小说")) //指定条件来删除数据
```

#### 4.查询数据

查询条件可以参考官方的[relationalStore.RdbPredicates](https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates)。

```typescript
import { database } from '@zxhhyj/storm'

for (const queryElement of database.of(books).query()) {
  //...
}
for (const queryElement of database.of(books).query(it => it.it.equalTo(bookcases.name, "科幻小说"))) {
  //...
}
```

#### 5.使用事务

使用`beginTransaction`来开启一个事务。

```typescript
import { database } from '@zxhhyj/storm'

try {
  const bookcase: Bookcase = {
    name: "科幻小说"
  }
  database
    .beginTransaction(it => it
      .to(bookcases)
      .add(bookcase)
      .run(() => {
        throw new Error('强制停止，让事务回滚')
      })
    )
} catch (e) {
  //在此查询数据已验证事务是否生效
}
```

### 更新数据库

当需要升级数据库时，需要在`Table`下显式声明`tableVersion`属性，这个属性需要为整数且大于`1`。
之后在调用`of`、`to`时将会升级操作，`Storm`将会依次调用`upVersion`函数，需要重写这个函数并在其中返回这个版本中表有哪些更新，目前支持新增列和移除列。

```typescript
import { Column, Table, TableUpdateInfo } from '@zxhhyj/storm';

class NewVerBookcases extends Table<NewBookcase> {
  override readonly tableVersion = 2
  /**
   * 需要注意的是，这个NewVerBookcases实际就是Bookcases，只是方便做演示用例才创建了两个类
   */
  override readonly tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').notNull().bindTo(this, 'name')
  /**
   * 这个是新增的列
   */
  readonly createDataTime =
    Column.date('create_data_time').default(new Date().toString()).bindTo(this, 'createDataTime')

  upVersion(version: number): TableUpdateInfo {
    /**
     * 当不显示声明tableVersion时，默认的版本为1，NewVerBookcases的最新版本为2
     * upVersion将被调用一次，upVersion(2)
     */
    if (version === 2) {
      //在此返回这个版本中表有哪些更新
      return {
        add: [this.createDataTime],
        //remove: [this.name]
        //不知道为什么同步执行删除指令时会报错？添加则没有问题，感觉是华子的问题
      }
    }
  }
}

export const newVerBookcases = new NewVerBookcases()

export declare class NewBookcase {
  id?: number
  name: string
  createDataTime?: Date
}
```

## 路线图

|                 路线                 |   预期上线版本   |   状态    |
|:----------------------------------:|:----------:|:-------:|
|        实现具有强类型且独立的数据库版本更新逻辑        |   1.3.0+   |   已完成   |
|       ~~对象模型与SQL模型的互转逻辑解耦~~        | ~~1.3.0+~~ | ~~已废弃~~ |
| 使用新的`bindTo`API来实现`Column`与实体的双向绑定 |   1.4.0+   |   已完成   |

## 已知问题

- 数据库版本更新从表中移除列的功能无法正常使用。

## 交流

如有疑问，请提`issues`或者致信到我的邮箱`957447668@qq.com`。