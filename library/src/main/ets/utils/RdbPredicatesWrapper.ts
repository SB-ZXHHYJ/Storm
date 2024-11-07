import { relationalStore } from '@kit.ArkData';
import { Column, Table } from '../schema/Table';
import { ValueType } from '@ohos.data.ValuesBucket';

/**
 * 与官方的relationalStore.RdbPredicates等价。
 * @link https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates
 */
export class RdbPredicatesWrapper<T> {
  readonly rdbPredicates: relationalStore.RdbPredicates

  constructor(targetTable: Table<T>) {
    this.rdbPredicates = new relationalStore.RdbPredicates(targetTable.tableName)
  }

  equalTo(column: Column<ValueType,any>, value: ValueType) {
    this.rdbPredicates.equalTo(column._fieldName, value)
    return this
  }

  notEqualTo(column: Column<ValueType,any>, value: ValueType) {
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

  isNull(column: Column<ValueType,any>) {
    this.rdbPredicates.isNull(column._fieldName)
    return this
  }

  isNotNull(column: Column<ValueType,any>) {
    this.rdbPredicates.isNotNull(column._fieldName)
    return this
  }

  like(column: Column<ValueType,any>, value: string) {
    this.rdbPredicates.like(column._fieldName, value)
    return this
  }

  contains(column: Column<ValueType,any>, value: string) {
    this.rdbPredicates.contains(column._fieldName, value)
    return this
  }

  beginsWith(column: Column<ValueType,any>, value: string) {
    this.rdbPredicates.beginsWith(column._fieldName, value)
    return this
  }

  endsWith(column: Column<ValueType,any>, value: string) {
    this.rdbPredicates.endsWith(column._fieldName, value)
    return this
  }

  glob(column: Column<ValueType,any>, value: string) {
    this.rdbPredicates.glob(column._fieldName, value)
    return this
  }

  between(column: Column<ValueType,any>, low: ValueType, high: ValueType) {
    this.rdbPredicates.between(column._fieldName, low, high)
    return this
  }

  notBetween(column: Column<ValueType,any>, low: ValueType, high: ValueType) {
    this.rdbPredicates.notBetween(column._fieldName, low, high)
    return this
  }

  greaterThan(column: Column<ValueType,any>, value: ValueType) {
    this.rdbPredicates.greaterThan(column._fieldName, value)
    return this
  }

  lessThan(column: Column<ValueType,any>, value: ValueType) {
    this.rdbPredicates.lessThan(column._fieldName, value)
    return this
  }

  greaterThanOrEqualTo(column: Column<ValueType,any>, value: ValueType) {
    this.rdbPredicates.greaterThanOrEqualTo(column._fieldName, value)
    return this
  }

  lessThanOrEqualTo(column: Column<ValueType,any>, value: ValueType) {
    this.rdbPredicates.lessThanOrEqualTo(column._fieldName, value)
    return this
  }

  orderByAsc(column: Column<ValueType,any>) {
    this.rdbPredicates.orderByAsc(column._fieldName)
    return this
  }

  orderByDesc(column: Column<ValueType,any>) {
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

  groupBy(columns: Column<ValueType,any>[]) {
    this.rdbPredicates.groupBy(columns.map(item => {
      return item._fieldName
    }))
    return this
  }

  indexedBy(column: Column<ValueType,any>) {
    this.rdbPredicates.indexedBy(column._fieldName)
    return this
  }

  in(column: Column<ValueType,any>, value: Array<ValueType>) {
    this.rdbPredicates.in(column._fieldName, value)
    return this
  }

  notIn(column: Column<ValueType,any>, value: Array<ValueType>) {
    this.rdbPredicates.notIn(column._fieldName, value)
    return this
  }

  notContains(column: Column<ValueType,any>, value: ValueType) {
    this.rdbPredicates.notContains(column._fieldName, value.toString())
    return this
  }

  notLike(column: Column<ValueType,any>, value: ValueType) {
    this.rdbPredicates.notLike(column._fieldName, value.toString())
    return this
  }
}