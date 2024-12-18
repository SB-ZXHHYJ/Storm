export interface Cursor<T> {
  /**
   * 获取集合中元素的数量
   * @returns 获取到的数量
   */
  get length(): number

  /**
   * 返回集合中的第一个元素，如果集合为空，则返回 null
   * @returns 第一个元素或 null
   */
  firstOrNull(): T | null

  /**
   * 返回集合中的第一个元素
   * @returns 第一个元素
   * @throws 如果结果为空，则抛出错误
   */
  first(): T

  /**
   * 返回集合中的最后一个元素
   * @returns 最后一个元素或 null
   */
  lastOrNull(): T | null

  /**
   * 返回集合中的最后一个元素
   * @returns 最后一个元素
   * @throws 如果结果为空，则抛出错误
   */
  last(): T

  /**
   * 根据索引返回集合中的元素
   * @param index 索引位置
   * @returns 对应的元素
   * @throws 如果结果为空，则抛出错误
   */
  get(index: number): T

  /**
   * 根据索引返回集合中的元素
   * @param index 索引位置
   * @returns 对应的元素或 null
   */
  getOrNull(index: number): T | null

  /**
   * 返回集合中所有元素的数组
   * @returns 所有元素的数组
   */
  toList(): ReadonlyArray<T>

  /**
   * 返回集合中所有元素的只读数组
   * @returns 所有元素的数组或 null
   */
  toListOrNull(): ReadonlyArray<T> | null

  /**
   * 关闭游标
   */
  close(): void
}