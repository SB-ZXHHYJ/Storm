## 介绍

`Storm`是直接基于纯`TypeScript`编写的高效简洁的轻量级`OpenHarmonyOS SQL ORM`框架。

其部分设计思想来源于[Ktorm](https://www.ktorm.org/zh-cn/)。

## 安装

在命令行中执行以下命令。

```text
ohpm install @zxhhyj/storm
```

## 基本用法

### 创建数据库

创建`AppDatabase.ts`文件，并实现以下代码。

```typescript
import { AutoMigration, Database, DatabaseMigration, MigrationHelper, Storm } from '@zxhhyj/storm';
import { relationalStore } from '@kit.ArkData';
import { Context } from '@kit.AbilityKit';

class AppDatabase extends Database {
  initDb(context: Context) {
    return relationalStore.getRdbStore(context, { name: "app.db", securityLevel: relationalStore.SecurityLevel.S1 })
  }
}

export const myDatabase = Storm
  .databaseBuilder(AppDatabase)
  .build()
```

1. 重写`AppDatabase`中的`initDb`函数，在此返回你的`RdbStore`。
2. 使用`Storm .databaseBuilder(AppDatabase).build()`来构建你的`AppDatabase`并导出。

### 定义表结构

#### 1.定义书架类

创建`Bookcase.ts`文件，并实现以下代码。

```typescript
import { Column, Table } from '@zxhhyj/storm';

export interface Bookcase {
id?: number
name: string
}

export class BookcaseTable extends Table<Bookcase> {
  readonly tableName = 't_bookcase'

  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')
  readonly name = Column.text('name').notNull().bindTo(this, 'name')
}

export const TableBookcase = new BookcaseTable()
```

1. `Bookcase`是你的实体模式。
2. `BookcaseTable`是你的表，`tableName`是你的表名，`id`和`name`是你表中的列。
3. 最后`new BookcaseTable()`，然后导出。

PS:_推荐使用使用`interface`或`declare class`来修饰`model`_

#### 2.定义书本类

```typescript
import { Column, Dao, Storm, Table } from '@zxhhyj/storm';
import { Bookcase, TableBookcase } from './Bookcase';

export interface Book {
id?: number
name: string
bookcase: Bookcase
createDataTime: Date
visibility: boolean
}

export class BookTable extends Table<Book> {
  readonly tableName = 't_book'

  readonly id = Column.integer('id').primaryKey(true).bindTo(this, 'id')

  readonly name = Column.text('name').unique().bindTo(this, 'name')

  readonly bookcase = Column.references('bookcase_id', TableBookcase).bindTo(this, 'bookcase')

  readonly createDataTime =
    Column.date('create_data_time').default(new Date().toString()).bindTo(this, 'createDataTime')

  readonly visibility = Column.boolean('visibility').bindTo(this, 'visibility')

  readonly datetimeIndex =
    Column.index('t_book_index_name').column(this.name, 'ASC').column(this.visibility).bindTo(this)
}

export const TableBook = new BookTable()
```

### 初始化数据库

至此，我们已经拥有了`BookcaseTable`和`BookTable`两张表的映射信息。现在我们需要把这两张表写到`AppDatabase`中，这样`Storm`
就能识别并为这两张表创建`Dao`。

```typescript
import { AutoMigration, Database, Storm } from '@zxhhyj/storm';
import { relationalStore } from '@kit.ArkData';
import { TableBookcase } from '../model/Bookcase';
import { DaoMyBook, TableBook } from '../model/Book';
import { TableBlob } from '../model/Blob';
import { Context } from '@kit.AbilityKit';

class AppDatabase extends Database {
  initDb(context: Context) {
    return relationalStore.getRdbStore(context, { name: "app.db", securityLevel: relationalStore.SecurityLevel.S1 })
  }

  readonly bookDao = TableBook
  readonly bookcaseDao = TableBookcase
  //将前文中定义的两个表写到 AppDatabase 下，建议以 xxxDao 的形式命名
}

export const myDatabase = Storm
  .databaseBuilder(AppDatabase)
  .setVersion(1)//设置数据库的版本
  .addMigrations(AutoMigration)//设置当数据库未初始化时自动初始化，初始化后的版本号为 setVersion 设置的版本号，即 1
  .build()
```

最后在使用前，调用`myDatabase.init(context)`函数进行初始化即可，可以在`AbilityStage`中初始化。

```typescript
import { AbilityStage, Want } from '@kit.AbilityKit';
import { myDatabase } from './logic/database/AppDatabase';

export default class AppAbilityStage extends AbilityStage {
  async onCreate() {
    await myDatabase.init(this.context)
  }

  onAcceptWant(_want: Want): string {
    return 'AppAbilityStage';
  }
}
```

### 增删改查

经过上面的设置，你已经可以调用`myDatabase.bookcaseDao`和`myDatabase.bookDao`来访问`Storm`中内置的`Dao`来进行增删改查了。

#### 1.增加数据

```typescript
import { database } from '@zxhhyj/storm'

const bookcase: Bookcase = {
  name: "科幻小说"
}
const book: Book = {
  name: "三体",
  bookcase: bookcase,
  createDataTime: new Date(),
  visibility: true
}
myDatabase.bookcaseDao.add(bookcase)
myDatabase.bookDao.add(book)
```

#### 2.删除数据

```typescript
const bookcase: Bookcase = {
  name: "科幻小说"
}
myDatabase.bookcaseDao
  .add(bookcase)
  .begin(() => {
    bookcase.name = "女生小说"
    //修改 name 的值
  })
  .update(bookcase) //将修改后的值更新到数据库中
```

使用`update`需要数据中存在主键，否则将触发异常。
如果需要使用`RdbPredicates`，可以使用`updateIf`。

```typescript
const bookcase: Bookcase = {
  name: "科幻小说"
}
myDatabase.bookcaseDao
  .add(bookcase)
  .updateIf(it => it.equalTo(TableBookcase.id, bookcase.id), { name: '女生小说' })
```

#### 3.删除数据

```typescript
myDatabase.bookcaseDao
  .add(bookcase)
  .remove(bookcase) //移除数据
```

使用`remove`需要数据中存在唯一主键，否则将触发异常。
如果不知道主键或需要使用`RdbPredicates`，可以使用`removeIf`。

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

```typescript
const list = myDatabase.bookDao.toList()
//查询 BookTable 在数据库中全部的数据
```

```typescript
const list = myDatabase.bookDao.toList(it => it.equalTo(TableBook.name, '三体'))
//查询 BookTable 在数据库中符合条件的全部数据
```

```typescript
const list = myDatabase.bookDao.toList(it => it.equalTo(TableBook.name, '三体'), TableBook.name)
for (const listElement of list) {
  console.log(listElement.name.toString())
  listElement.id //ide 会报错，找不到这个属性
}
//查询 BookTable 在数据库中符合条件的全部数据，同时指定只查询 name 列
```

更多查询方式另参[DatabaseDao](library/src/main/ets/database/DatabaseDao.ts)。

#### 5.使用事务

使用`beginTransaction`API可以开启事务，处于`lambda`下的逻辑都将具有事务的原子性。

```typescript
try {
  const bookcase: Bookcase = {
    name: "科幻小说"
  }
  myDatabase.bookcaseDao.beginTransaction(database => {
    database.add(bookcase)
    throw new Error('强制停止，让事务回滚')
  })
} catch (e) {
  //...
}
```

### 高级用法

有时候你需要对增删改查等操作进行封装，这时候自定义`Dao`就派上用场了。

#### 1.自定义 Dao

```typescript
class MyBookDao extends Dao<BookTable> {
  add(book: Book) {
    this.dao.add(book)
    //...
  }

  remove(book: Book) {
    this.dao.remove(book)
    //...
  }

  //...
}

export const DaoMyBook = Storm.daoBuilder(MyBookDao).select(TableBook).build()
```

### 开源协议

本项目基于 [Apache License 2.0](LICENSE)。

### 交流

如有疑问，请提`issues`或者致信到我的邮箱`957447668@qq.com`。