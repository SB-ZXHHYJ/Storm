import { SupportValueTypes } from './Column'

export type TypeConverters<W extends SupportValueTypes, R> = {
  /**
   * 将 R 类型的值转换为数据库支持的 W 类型以进行存储
   *
   * @param value 要保存的值，类型为 R
   * @returns 转换后的数据库支持类型的值
   */
  save: (value: R) => W
  /**
   * 将从数据库读取的 W 类型值转换为原始的 R 类型
   *
   * @param value 从数据库读取的值，类型为 W
   * @returns 转换后的原始输入类型的值
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