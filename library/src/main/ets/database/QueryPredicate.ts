import { relationalStore } from '@kit.ArkData';
import { Table } from '../schema/Table';
import { IColumn, IIndexColumn, SupportValueTypes } from '../schema/Column';

/**
 * 对relationalStore.RdbPredicates进行包装
 * @link https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates
 */
export class QueryPredicate<T> {
  private readonly rdbPredicates: relationalStore.RdbPredicates

  private constructor(targetTable: Table<T>) {
    this.rdbPredicates = new relationalStore.RdbPredicates(targetTable.tableName)
  }

  static of<T>(targetTable: Table<T>) {
    return new QueryPredicate(targetTable)
  }

  equalTo(column: IColumn, value: SupportValueTypes) {
    this.rdbPredicates.equalTo(column._fieldName, value)
    return this
  }

  notEqualTo(column: IColumn, value: SupportValueTypes) {
    this.rdbPredicates.notEqualTo(column._fieldName, value)
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

  isNull(column: IColumn) {
    this.rdbPredicates.isNull(column._fieldName)
    return this
  }

  isNotNull(column: IColumn) {
    this.rdbPredicates.isNotNull(column._fieldName)
    return this
  }

  like(column: IColumn, value: string) {
    this.rdbPredicates.like(column._fieldName, value)
    return this
  }

  contains(column: IColumn, value: string) {
    this.rdbPredicates.contains(column._fieldName, value)
    return this
  }

  beginsWith(column: IColumn, value: string) {
    this.rdbPredicates.beginsWith(column._fieldName, value)
    return this
  }

  endsWith(column: IColumn, value: string) {
    this.rdbPredicates.endsWith(column._fieldName, value)
    return this
  }

  glob(column: IColumn, value: string) {
    this.rdbPredicates.glob(column._fieldName, value)
    return this
  }

  between(column: IColumn, low: SupportValueTypes, high: SupportValueTypes) {
    this.rdbPredicates.between(column._fieldName, low, high)
    return this
  }

  notBetween(column: IColumn, low: SupportValueTypes, high: SupportValueTypes) {
    this.rdbPredicates.notBetween(column._fieldName, low, high)
    return this
  }

  greaterThan(column: IColumn, value: SupportValueTypes) {
    this.rdbPredicates.greaterThan(column._fieldName, value)
    return this
  }

  lessThan(column: IColumn, value: SupportValueTypes) {
    this.rdbPredicates.lessThan(column._fieldName, value)
    return this
  }

  greaterThanOrEqualTo(column: IColumn, value: SupportValueTypes) {
    this.rdbPredicates.greaterThanOrEqualTo(column._fieldName, value)
    return this
  }

  lessThanOrEqualTo(column: IColumn, value: SupportValueTypes) {
    this.rdbPredicates.lessThanOrEqualTo(column._fieldName, value)
    return this
  }

  orderByAsc(column: IColumn) {
    this.rdbPredicates.orderByAsc(column._fieldName)
    return this
  }

  orderByDesc(column: IColumn) {
    this.rdbPredicates.orderByDesc(column._fieldName)
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

  groupBy(columns: IColumn[]) {
    this.rdbPredicates.groupBy(columns.map(item => {
      return item._fieldName
    }))
    return this
  }

  indexedBy(column: IIndexColumn) {
    this.rdbPredicates.indexedBy(column._fieldName)
    return this
  }

  in(column: IColumn, value: Array<SupportValueTypes>) {
    this.rdbPredicates.in(column._fieldName, value)
    return this
  }

  notIn(column: IColumn, value: Array<SupportValueTypes>) {
    this.rdbPredicates.notIn(column._fieldName, value)
    return this
  }

  notContains(column: IColumn, value: SupportValueTypes) {
    this.rdbPredicates.notContains(column._fieldName, value.toString())
    return this
  }

  notLike(column: IColumn, value: SupportValueTypes) {
    this.rdbPredicates.notLike(column._fieldName, value.toString())
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
