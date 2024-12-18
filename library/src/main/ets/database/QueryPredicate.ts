import { relationalStore } from '@kit.ArkData';
import { Table } from '../schema/Table';
import { ColumnTypes, IndexColumnTypes, SupportValueTypes } from '../schema/Column';

/**
 * 对relationalStore.RdbPredicates进行包装
 * @link https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates
 */
export class QueryPredicate<T> {
  private readonly rdbPredicates: relationalStore.RdbPredicates

  private constructor(targetTable: Table<T>) {
    this.rdbPredicates = new relationalStore.RdbPredicates(targetTable.tableName)
  }

  static select<T>(targetTable: Table<T>) {
    return new QueryPredicate(targetTable)
  }

  equalTo(column: ColumnTypes, value: SupportValueTypes) {
    this.rdbPredicates.equalTo(column.fieldName, value)
    return this
  }

  notEqualTo(column: ColumnTypes, value: SupportValueTypes) {
    this.rdbPredicates.notEqualTo(column.fieldName, value)
    return this
  }

  beginWrap() {
    this.rdbPredicates.beginWrap()
    return this
  }

  endWrap() {
    this.rdbPredicates.endWrap()
    return this
  }

  or() {
    this.rdbPredicates.or()
    return this
  }

  and() {
    this.rdbPredicates.and()
    return this
  }

  isNull(column: ColumnTypes) {
    this.rdbPredicates.isNull(column.fieldName)
    return this
  }

  isNotNull(column: ColumnTypes) {
    this.rdbPredicates.isNotNull(column.fieldName)
    return this
  }

  like(column: ColumnTypes, value: string) {
    this.rdbPredicates.like(column.fieldName, value)
    return this
  }

  contains(column: ColumnTypes, value: string) {
    this.rdbPredicates.contains(column.fieldName, value)
    return this
  }

  beginsWith(column: ColumnTypes, value: string) {
    this.rdbPredicates.beginsWith(column.fieldName, value)
    return this
  }

  endsWith(column: ColumnTypes, value: string) {
    this.rdbPredicates.endsWith(column.fieldName, value)
    return this
  }

  glob(column: ColumnTypes, value: string) {
    this.rdbPredicates.glob(column.fieldName, value)
    return this
  }

  between(column: ColumnTypes, low: SupportValueTypes, high: SupportValueTypes) {
    this.rdbPredicates.between(column.fieldName, low, high)
    return this
  }

  notBetween(column: ColumnTypes, low: SupportValueTypes, high: SupportValueTypes) {
    this.rdbPredicates.notBetween(column.fieldName, low, high)
    return this
  }

  greaterThan(column: ColumnTypes, value: SupportValueTypes) {
    this.rdbPredicates.greaterThan(column.fieldName, value)
    return this
  }

  lessThan(column: ColumnTypes, value: SupportValueTypes) {
    this.rdbPredicates.lessThan(column.fieldName, value)
    return this
  }

  greaterThanOrEqualTo(column: ColumnTypes, value: SupportValueTypes) {
    this.rdbPredicates.greaterThanOrEqualTo(column.fieldName, value)
    return this
  }

  lessThanOrEqualTo(column: ColumnTypes, value: SupportValueTypes) {
    this.rdbPredicates.lessThanOrEqualTo(column.fieldName, value)
    return this
  }

  orderByAsc(column: ColumnTypes) {
    this.rdbPredicates.orderByAsc(column.fieldName)
    return this
  }

  orderByDesc(column: ColumnTypes) {
    this.rdbPredicates.orderByDesc(column.fieldName)
    return this
  }

  distinct() {
    this.rdbPredicates.distinct()
    return this
  }

  limitAs(value: number) {
    this.rdbPredicates.limitAs(value)
    return this
  }

  offsetAs(value: number) {
    this.rdbPredicates.offsetAs(value)
    return this
  }

  groupBy(columns: ColumnTypes[]) {
    this.rdbPredicates.groupBy(columns.map(item => item.fieldName))
    return this
  }

  indexedBy(column: IndexColumnTypes) {
    this.rdbPredicates.indexedBy(column.fieldName)
    return this
  }

  in(column: ColumnTypes, value: Array<SupportValueTypes>) {
    this.rdbPredicates.in(column.fieldName, value)
    return this
  }

  notIn(column: ColumnTypes, value: Array<SupportValueTypes>) {
    this.rdbPredicates.notIn(column.fieldName, value)
    return this
  }

  notContains(column: ColumnTypes, value: SupportValueTypes) {
    this.rdbPredicates.notContains(column.fieldName, value.toString())
    return this
  }

  notLike(column: ColumnTypes, value: SupportValueTypes) {
    this.rdbPredicates.notLike(column.fieldName, value.toString())
    return this
  }

  /**
   * 获取实际的relationalStore.RdbPredicates
   * @returns {relationalStore.RdbPredicates}
   */
  getRdbPredicates() {
    return this.rdbPredicates
  }
}
