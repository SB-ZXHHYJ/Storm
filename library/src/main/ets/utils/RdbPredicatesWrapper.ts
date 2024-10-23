import { relationalStore } from '@kit.ArkData';
import { Column, Table } from '../schema/Table';
import { ValueType } from '@ohos.data.ValuesBucket';

export class RdbPredicatesWrapper<T> {
  readonly rdbPredicates: relationalStore.RdbPredicates

  constructor(table: Table<T>) {
    this.rdbPredicates = new relationalStore.RdbPredicates(table.tableName)
  }

  equalTo(column: Column<ValueType>, value: ValueType) {
    this.rdbPredicates.equalTo(column.fieldName, value)
    return this
  }

  notEqualTo(column: Column<ValueType>, value: ValueType) {
    this.rdbPredicates.notEqualTo(column.fieldName, value)
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

  isNull(column: Column<ValueType>) {
    this.rdbPredicates.isNull(column.fieldName)
    return this
  }

  isNotNull(column: Column<ValueType>) {
    this.rdbPredicates.isNotNull(column.fieldName)
    return this
  }

  like(column: Column<ValueType>, value: string) {
    this.rdbPredicates.like(column.fieldName, value)
    return this
  }

  contains(column: Column<ValueType>, value: string) {
    this.rdbPredicates.contains(column.fieldName, value)
    return this
  }

  beginsWith(column: Column<ValueType>, value: string) {
    this.rdbPredicates.beginsWith(column.fieldName, value)
    return this
  }

  endsWith(column: Column<ValueType>, value: string) {
    this.rdbPredicates.endsWith(column.fieldName, value)
    return this
  }

  glob(column: Column<ValueType>, value: string) {
    this.rdbPredicates.glob(column.fieldName, value)
    return this
  }

  between(column: Column<ValueType>, low: ValueType, high: ValueType) {
    this.rdbPredicates.between(column.fieldName, low, high)
    return this
  }

  notBetween(column: Column<ValueType>, low: ValueType, high: ValueType) {
    this.rdbPredicates.notBetween(column.fieldName, low, high)
    return this
  }

  greaterThan(column: Column<ValueType>, value: ValueType) {
    this.rdbPredicates.greaterThan(column.fieldName, value)
    return this
  }

  lessThan(column: Column<ValueType>, value: ValueType) {
    this.rdbPredicates.lessThan(column.fieldName, value)
    return this
  }

  greaterThanOrEqualTo(column: Column<ValueType>, value: ValueType) {
    this.rdbPredicates.greaterThanOrEqualTo(column.fieldName, value)
    return this
  }

  lessThanOrEqualTo(column: Column<ValueType>, value: ValueType) {
    this.rdbPredicates.lessThanOrEqualTo(column.fieldName, value)
    return this
  }

  orderByAsc(column: Column<ValueType>) {
    this.rdbPredicates.orderByAsc(column.fieldName)
    return this
  }

  orderByDesc(column: Column<ValueType>) {
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

  groupBy(columns: Column<ValueType>[]) {
    this.rdbPredicates.groupBy(columns.map(item => {
      return item.fieldName
    }))
    return this
  }

  indexedBy(column: Column<ValueType>) {
    this.rdbPredicates.indexedBy(column.fieldName)
    return this
  }

  in(column: Column<ValueType>, value: Array<ValueType>) {
    this.rdbPredicates.in(column.fieldName, value)
    return this
  }

  notIn(column: Column<ValueType>, value: Array<ValueType>) {
    this.rdbPredicates.notIn(column.fieldName, value)
    return this
  }

  notContains(column: Column<ValueType>, value: ValueType) {
    this.rdbPredicates.notContains(column.fieldName, value.toString())
    return this
  }

  notLike(column: Column<ValueType>, value: ValueType) {
    this.rdbPredicates.notLike(column.fieldName, value.toString())
    return this
  }
}