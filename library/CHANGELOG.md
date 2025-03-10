## 版本更新记录

### 2024/12/25 - 2.0.0

全新的`2.0.0`版本已经到来，本次更新内容较多，如果你是从旧版本升级而来，请务必详细阅读`README.md`。

#### 移除

- 移除了`DatabaseCrud`下的`of`、`to`、`clear`和`delete`API。
- 移除了`query`API下的`toMutableList`API。
- 移除了`自动更新数据库(实验性)`。
- 移除了`toList`API在数组为空时的异常抛出。
- 移除了~~所有的空值将被认为是null，使其更加符合sqlite的数据规范~~的规范。
- 移除了库中预留的全局唯一`Database`变量相关的API。

#### 优化

- 将`DatabaseCrud`更名为`DatabaseDao`。
- 将`run`API名称重命名为`begin`。
- 移除`query`API，所有相关API移至与原`query`API同层级位置（不包括迭代器），`length`API更名为 `count`。

#### 新增

- 新增了`DatabaseMigration`和`TableMigration`来处理数据库版本升级。
- 新增了自定义`Dao`的功能。
- 新增了自定义`Database`的功能。
- `DatabaseDao`新增`beginAsync`API来异步访问`Dao`。
- `DatabaseDao`新增`Cursor`API来查询数据。
- `Column`新增`index`API来创建索引列。
- `Column`新增内部实现为`timestamp`的`date`列。
- 新增了`SupportSqliteCmds`API来快速创建`SQL`语句。
- 查询语句新增支持查询指定列的功能。

#### 修复

- 修正了`QueryPredicate`下的`endWrap`API效果不正确的问题。
- 修复了`Column`下的`bindTo`API中`key`类型会推导错误和无法识别可选属性`(?:)`的问题。

### 2024/12/04 - 1.7.6

#### 优化

- `firstOrNull`API的返回值为空时不再是`undefined`而是`null`,使其更符合规范。

#### 新增

- 新增了`lastOrNull`和`last`API，使其在获取最后一个元素时更加方便快捷。
- 新增了`toMutableList`API来获取可变的数组。

### 2024/11/30 - 1.7.5

#### 优化

- 对于`ID`列是自增的情况下，如果`ID`的值不是有效值，即`if`条件判断为`false`的值，`Storm`会忽略这个值。

### 2024/11/27 - 1.7.4

#### 修复

- 修复当`ReferencesColumn`的值为`undefined`或者`null`的时候报错的问题。
- 修复在事务中自增`ID`获取的问题。

### 2024/11/26 - 1.7.3

- 修复了数据库自动版本更新异常的问题。

### 2024/11/22 - 1.7.2

#### 优化

- 所有的空值将被认为是`null`，使其更加符合`sqlite`的数据规范。

### 2024/11/21 - 1.7.1

#### 修复

- 修复了`Column.date`在当写入/读取时值为`undefined`或者`null`时可能会闪退的问题。
- 修复了`Column.boolean`在当写入/读取时值为`undefined`或者`null`时会导致值与预期不符的问题。

### 2024/11/20 - 1.7.0

#### 新增

- `Column`新增`blob`API来创建`BLOB`类型的列。
- 新增`delete`API来从数据库中删除某个表.
- 新增了自动升级数据库的功能(实验性)

#### 优化

- `bindTo`API新增了类型检查，避免将不同类型的`Column`与`value`进行绑定。
- 新增了`length`、`toList`、`first`、`firstOrNull`API来提高查询时的性能和灵活性。

#### 移除

- 移除了`reset`API。
- 移除了`begin`API。

#### 警告

- **注意`1.7.0`不再支持`qurey[index]`的形式获取值，请改用`qurey.first`或者`qurey.toList[index]`**

### 2024/11/13 - 1.6.2

#### 优化

- `Database.create`API修改为接收一个`relationalStore.RdbStore`作为参数，使`Storm`可以与其他`SQL`框架同时工作。

#### 废弃

- 废弃了`begin`API，将由`run`API替代。

### 2024/11/12 - 1.6.1

#### 新增

- `Database`新增`begin`和`beginTransaction`API，支持直接开启事务，不再需要调用`of`或者`to`后才能开启。

### 2024/11/12 - 1.6.0

#### 优化

- 优化了封装性。
- 优化了文档中的若干错误。
- 更多的运行时检查，让开发者更快速定位到问题。

#### 移除

- 移除了`@SqlTable`和`@SqlColumns`注解，请使用`bindTo`API替代它们的职能。

### 2024/11/11 - 1.5.0

#### 新增

- `Column`中新增了`bindTo`API来将`Column`与实体属性进行双向绑定。

#### 优化

- `Column`中的`entity`API已被移除，请使用更优秀的`references`API替代。
- 优化了部分注释的可读性。

#### 废弃

- `@SqlTable`注解已被废弃，将不再产生任何作用了。

### 2024/11/10 - 1.4.0

#### 新增

- 新增了强类型且数据库各自独立的版本升级特性。

#### 修复

- 修复了数据库中存在某个列，但是实体中没有时查询数据会闪退的问题。
- 修复使用`updateIf`时`Table`中定义的属性名与实体中的属性名不同时闪退的问题。
- 修复了当主键不为`INTEGER`类型且并非为自增列时会造成异常的问题。

#### 优化

- 使用`of`和`to`时将不会反复创建新的操作对象了，提高了性能。
- 优化了插入数据时的性能。
- 成功插入数据时，表中如果存在主键且实体的主键为空时，`Strom`会将主键填充至插入的实体中。

### 2024/11/07 - 1.3.0

- 性能和封装性优化。
- `Column`新增`json`API来存储`自定义类型`。
- `Column`新增`date`API来存储`Date`类型的数据。
- `Column`新增`default`API来设置默认值。
- `Column`新增`real`API来存储`REAL`类型的数据。
- `Column`将`number`API更名为`integer`。
- `Column`将`string`API更名为`text`。
- `Column`将`boolean`API的实际类型从`TEXT`变更为`INTEGER`，如果此前使用过`boolean`API，请使用`自定义类型进行兼容`。

### 2024/11/06 - 1.2.3

- 修复多个bug。
- 允许将实体属性设置为`null`，以从表中移除该属性。
- `updateIf`现支持了更精细的操作。

### 2024/11/06 - 1.2.2

- 新增`updateIf`条件更新、`removeIf`条件移除及`reset`重置API，以适应更多使用场景。
- 更多的运行时警告，以规范`Storm`的使用。

### 2024/11/06 - 1.2.1

- 修复文档中的多处错误。
- 性能优化。

### 2024/11/05 - 1.2.0

- 修复多个bug。
- 移除`insertCount`、`updateCount`、`removeCount` API。
- 优化注释的可读性。

### 2024/11/03 - 1.1.0

- 修复多个bug。
- 对`增删改查`API进行了细分，以提升链式调用的便捷性。
- 将`sequenceOf`API更名为`of`。

### 2024/11/01 - 1.0.3

- 修复`README`中的一些错误。
- 在`README`中新增查询数据的示例。

### 2024/11/01 - 1.0.2

- 新增了未定义`idColumn`时的错误提示。
- 优化多次增删改查操作的性能。

### 2024/11/01 - 1.0.1

- 新增`remove`API。
- 为部分API添加了注释。

### 2024/10/29 - 1.0.0

- 完成核心功能并发布第一个版本。