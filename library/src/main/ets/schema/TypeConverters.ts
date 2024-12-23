import { SupportValueTypes } from './Column'

export type TypeConverters<W extends SupportValueTypes, R> = {
  /**
   * 将实体转换为数据库支持的类型保存
   */
  save: (value: R) => W
  /**
   * 将从数据库中读出的数据转换回实体
   */
  restore: (value: W) => R
}

/**
 * 内置的布尔类型转换器
 */
export const BooleanTypeConverters: TypeConverters<number, boolean> = {
  save: value => {
    if (value === true) {
      return 1
    }
    if (value === false) {
      return 0
    }
  },
  restore: value => {
    if (value === 1) {
      return true
    }
    if (value === 0) {
      return false
    }
  }
}

/**
 * 内置的 Date 类型转换器
 */
export const DateTypeConverters: TypeConverters<string, Date> = {
  save: value => {
    return value.toString()
  },
  restore: value => {
    return new Date(value)
  }
}

/**
 * 内置的 TimeStamp 类型转换器
 */
export const TimestampTypeConverters: TypeConverters<number, Date> = {
  save: value => {
    return value.getTime()
  },
  restore: value => {
    return new Date(value)
  }
}