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

使用`Database.create`方法来创建数据库实例后，可以将其赋值给`database.globalDatabase`这是库中预留的全局唯一`Database`
变量赋值后，可以更方便地使用`database`下的`close`和`of`函数。

```typescript
database.globalDatabase = await Database.create(this.context, {
  name: "app.db",
  securityLevel: relationalStore.SecurityLevel.S1
});
```

### 定义表结构

#### 1.定义 Bookcase 类

属性：

- **`tableName`**：表名
- **`id`**：`INTEGER`类型，主键且自动递增
- **`name`**：`TEXT`类型，并使用`NOT NULL`和`UNIQUE`修饰符

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

属性：

- **`tableName`**：表名
- **`id`**：`INTEGER`类型，主键且自动递增
- **`name`**：`TEXT`类型，并使用`UNIQUE`修饰符
- **`bookcase`**：
    - 类型：`INTEGER`类型，列名为`bookcase_id`
    - 存储：将`Bookcase`的主键存储到`bookcase_id`中
    - 读取：根据`bookcase_id`查询实体并填充
- **`createDataTime`**:
    - 类型：`TEXT`类型，列名为`create_data_time`
    - 存储：使用内置的`DateTypeConverters`将`Date`转换为`string`类型存储
    - 读取：使用内置的`DateTypeConverters`将读出的`string`来恢复为`Date`

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

**先使用`of`来确定要操作的表，后续使用`to`来切换要操作的表**，然后使用`add`方法将数据添加到数据库中

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

使用`update`将数据库中的数据更新，使用`update`需要数据中存在主键，否则更新失败。

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

如果不知道主键或想实现更精细化的操作需要使用`updateIf`。

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

使用`remove`将数据库中的数据更新，使用`remove`需要数据中存在主键，否则更新失败。

```typescript
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
const bookcase: Bookcase = {
  name: "科幻小说"
}
database
  .of(bookcases)
  .add(bookcase)
  .removeIf(it => it.equalTo(bookcases.name, "科幻小说")) //指定条件来删除数据
```

#### 4.使用事务

使用`beginTransaction`来开启一个事务。

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

查询条件可以参考官方的[relationalStore.RdbPredicates](https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates)。

```typescript
for (const queryElement of database.of(books).query()) {
  //...
}
for (const queryElement of database.of(books).query(it => it.it.equalTo(bookcases.name, "科幻小说"))) {
  //...
}
```

### 更新数据库

当需要升级数据库时，需要在`Table`下显式声明`tableVersion`属性，这个属性需要为整数且大于`1`。
之后在调用`of`、`to`时将会升级操作，`Storm`将会依次调用`upVersion`函数，需要重写这个函数并在其中返回这个版本中表有哪些更新，目前支持新增列和移除列。

```typescript
class NewVerBookcases extends Table<NewBookcase> {
  override readonly tableVersion = 2
  /**
   * 需要注意的是，这个NewVerBookcases实际就是Bookcases，只是方便做演示用例才创建了两个类
   */
  override readonly tableName = 't_bookcase'
  readonly id = Column.integer('id').primaryKey(true)
  readonly name = Column.text('name')
  /**
   * 这个是新增的列
   */
  readonly createDataTime = Column.date("create_data_time").default(new Date().toString())

  upVersion(version: number): TableUpdateInfo {
    /**
     * 当不显示声明tableVersion时，默认的版本为1，NewVerBookcases的最新版本为2
     * upVersion将被调用一次，upVersion(2)
     */
    if (version === 2) {
      return {
        add: [this.createDataTime],
        //remove: [this.name]
        // 不知道为什么同步执行删除指令时会报错，非同步不报错但是又会没有效果
      }
      //然后在此返回这个版本中表有哪些更新
    }
  }
}

export const newVerBookcases = new NewVerBookcases()

@SqlTable(newVerBookcases)
export class NewBookcase {
  @SqlColumn(newVerBookcases.id)
  id?: number
  @SqlColumn(newVerBookcases.name)
  name: string
  @SqlColumn(newVerBookcases.createDataTime)
  createDataTime?: Date
}
```

## 路线图

|                 路线                 | 预期上线版本 | 状态  |
|:----------------------------------:|:------:|:---:|
|        实现具有强类型且独立的数据库版本更新逻辑        |  1.3+  | 已完成 |
|         对象模型与SQL模型的互转逻辑解耦          |  1.3+  | 未完成 |
| 使用新的`bindTo`API来实现`Column`与实体的双向绑定 |  1.4+  | 已完成 |

## 已知问题

- 数据库版本更新从表中移除列的功能无法正常使用。

## 交流

如有疑问，请提`issues`或者致信到我的邮箱`957447668@qq.com`。