import { relationalStore } from '@kit.ArkData';
import { Table } from '../schema/Table';
import { IValueColumn, SupportValueType } from '../schema/Column';

/**
 * 对relationalStore.RdbPredicates进行包装
 * @link https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates
 */
export class QueryPredicate<T> {
  private readonly rdbPredicates: relationalStore.RdbPredicates

  /**
   * 获取实际的relationalStore.RdbPredicates
   * @returns {relationalStore.RdbPredicates}
   */
  getRdbPredicates() {
    return this.rdbPredicates
  }

  constructor(targetTable: Table<T>) {
    this.rdbPredicates = new relationalStore.RdbPredicates(targetTable.tableName)
  }

  equalTo(column: IValueColumn, value: SupportValueType) {
    this.rdbPredicates.equalTo(column._fieldName, value)
    return this
  }

  notEqualTo(column: IValueColumn, value: SupportValueType) {
    this.rdbPredicates.notEqualTo(column._fieldName, value)
    return this
  }

  beginWrap() {
    this.rdbPredicates.beginWrap()
    return this
  }

  endWrap() {
    this.rdbPredicates.beginWrap()
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

  isNull(column: IValueColumn) {
    this.rdbPredicates.isNull(column._fieldName)
    return this
  }

  isNotNull(column: IValueColumn) {
    this.rdbPredicates.isNotNull(column._fieldName)
    return this
  }

  like(column: IValueColumn, value: string) {
    this.rdbPredicates.like(column._fieldName, value)
    return this
  }

  contains(column: IValueColumn, value: string) {
    this.rdbPredicates.contains(column._fieldName, value)
    return this
  }

  beginsWith(column: IValueColumn, value: string) {
    this.rdbPredicates.beginsWith(column._fieldName, value)
    return this
  }

  endsWith(column: IValueColumn, value: string) {
    this.rdbPredicates.endsWith(column._fieldName, value)
    return this
  }

  glob(column: IValueColumn, value: string) {
    this.rdbPredicates.glob(column._fieldName, value)
    return this
  }

  between(column: IValueColumn, low: SupportValueType, high: SupportValueType) {
    this.rdbPredicates.between(column._fieldName, low, high)
    return this
  }

  notBetween(column: IValueColumn, low: SupportValueType, high: SupportValueType) {
    this.rdbPredicates.notBetween(column._fieldName, low, high)
    return this
  }

  greaterThan(column: IValueColumn, value: SupportValueType) {
    this.rdbPredicates.greaterThan(column._fieldName, value)
    return this
  }

  lessThan(column: IValueColumn, value: SupportValueType) {
    this.rdbPredicates.lessThan(column._fieldName, value)
    return this
  }

  greaterThanOrEqualTo(column: IValueColumn, value: SupportValueType) {
    this.rdbPredicates.greaterThanOrEqualTo(column._fieldName, value)
    return this
  }

  lessThanOrEqualTo(column: IValueColumn, value: SupportValueType) {
    this.rdbPredicates.lessThanOrEqualTo(column._fieldName, value)
    return this
  }

  orderByAsc(column: IValueColumn) {
    this.rdbPredicates.orderByAsc(column._fieldName)
    return this
  }

  orderByDesc(column: IValueColumn) {
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

  groupBy(columns: IValueColumn[]) {
    this.rdbPredicates.groupBy(columns.map(item => {
      return item._fieldName
    }))
    return this
  }

  indexedBy(column: IValueColumn) {
    this.rdbPredicates.indexedBy(column._fieldName)
    return this
  }

  in(column: IValueColumn, value: Array<SupportValueType>) {
    this.rdbPredicates.in(column._fieldName, value)
    return this
  }

  notIn(column: IValueColumn, value: Array<SupportValueType>) {
    this.rdbPredicates.notIn(column._fieldName, value)
    return this
  }

  notContains(column: IValueColumn, value: SupportValueType) {
    this.rdbPredicates.notContains(column._fieldName, value.toString())
    return this
  }

  notLike(column: IValueColumn, value: SupportValueType) {
    this.rdbPredicates.notLike(column._fieldName, value.toString())
    return this
  }
}