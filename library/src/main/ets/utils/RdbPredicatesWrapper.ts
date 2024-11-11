import { relationalStore } from '@kit.ArkData';
import { Table } from '../schema/Table';
import { ValueType } from '@ohos.data.ValuesBucket';
import { IValueColumn } from '../schema/Column';

/**
 * 对relationalStore.RdbPredicates进行包装
 * @link https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V2/js-apis-data-relationalstore-0000001493744128-V2#ZH-CN_TOPIC_0000001523648806__rdbpredicates
 */
export class RdbPredicatesWrapper<T> {
  readonly _rdbPredicates: relationalStore.RdbPredicates

  constructor(targetTable: Table<T>) {
    this._rdbPredicates = new relationalStore.RdbPredicates(targetTable.tableName)
  }

  equalTo(column: IValueColumn, value: ValueType) {
    this._rdbPredicates.equalTo(column._fieldName, value)
    return this
  }

  notEqualTo(column: IValueColumn, value: ValueType) {
    this._rdbPredicates.notEqualTo(column._fieldName, value)
    return this
  }

  beginWrap() {
    this._rdbPredicates.beginWrap()
    return this
  }

  endWrap() {
    this._rdbPredicates.beginWrap()
    return this
  }

  or() {
    this._rdbPredicates.or()
    return this
  }

  and() {
    this._rdbPredicates.and()
    return this
  }

  isNull(column: IValueColumn) {
    this._rdbPredicates.isNull(column._fieldName)
    return this
  }

  isNotNull(column: IValueColumn) {
    this._rdbPredicates.isNotNull(column._fieldName)
    return this
  }

  like(column: IValueColumn, value: string) {
    this._rdbPredicates.like(column._fieldName, value)
    return this
  }

  contains(column: IValueColumn, value: string) {
    this._rdbPredicates.contains(column._fieldName, value)
    return this
  }

  beginsWith(column: IValueColumn, value: string) {
    this._rdbPredicates.beginsWith(column._fieldName, value)
    return this
  }

  endsWith(column: IValueColumn, value: string) {
    this._rdbPredicates.endsWith(column._fieldName, value)
    return this
  }

  glob(column: IValueColumn, value: string) {
    this._rdbPredicates.glob(column._fieldName, value)
    return this
  }

  between(column: IValueColumn, low: ValueType, high: ValueType) {
    this._rdbPredicates.between(column._fieldName, low, high)
    return this
  }

  notBetween(column: IValueColumn, low: ValueType, high: ValueType) {
    this._rdbPredicates.notBetween(column._fieldName, low, high)
    return this
  }

  greaterThan(column: IValueColumn, value: ValueType) {
    this._rdbPredicates.greaterThan(column._fieldName, value)
    return this
  }

  lessThan(column: IValueColumn, value: ValueType) {
    this._rdbPredicates.lessThan(column._fieldName, value)
    return this
  }

  greaterThanOrEqualTo(column: IValueColumn, value: ValueType) {
    this._rdbPredicates.greaterThanOrEqualTo(column._fieldName, value)
    return this
  }

  lessThanOrEqualTo(column: IValueColumn, value: ValueType) {
    this._rdbPredicates.lessThanOrEqualTo(column._fieldName, value)
    return this
  }

  orderByAsc(column: IValueColumn) {
    this._rdbPredicates.orderByAsc(column._fieldName)
    return this
  }

  orderByDesc(column: IValueColumn) {
    this._rdbPredicates.orderByDesc(column._fieldName)
    return this
  }

  distinct() {
    this._rdbPredicates.distinct()
    return this
  }

  limitAs(value: number) {
    this._rdbPredicates.limitAs(value)
    return this
  }

  offsetAs(value: number) {
    this._rdbPredicates.offsetAs(value)
    return this
  }

  groupBy(columns: IValueColumn[]) {
    this._rdbPredicates.groupBy(columns.map(item => {
      return item._fieldName
    }))
    return this
  }

  indexedBy(column: IValueColumn) {
    this._rdbPredicates.indexedBy(column._fieldName)
    return this
  }

  in(column: IValueColumn, value: Array<ValueType>) {
    this._rdbPredicates.in(column._fieldName, value)
    return this
  }

  notIn(column: IValueColumn, value: Array<ValueType>) {
    this._rdbPredicates.notIn(column._fieldName, value)
    return this
  }

  notContains(column: IValueColumn, value: ValueType) {
    this._rdbPredicates.notContains(column._fieldName, value.toString())
    return this
  }

  notLike(column: IValueColumn, value: ValueType) {
    this._rdbPredicates.notLike(column._fieldName, value.toString())
    return this
  }
}