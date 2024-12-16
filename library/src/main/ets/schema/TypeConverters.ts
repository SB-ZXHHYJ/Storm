import { SupportValueTypes } from './Column'

export type TypeConverters<WriteType extends SupportValueTypes, ReadType> = {
  /**
   * 将实体转换为数据库支持的类型保存
   */
  save: (value: ReadType | null) => WriteType | null
  /**
   * 将从数据库中读出的数据转换回实体
   */
  restore: (value: WriteType | null) => ReadType | null
}

/**
 * 内置的布尔类型转换器
 */
export const BooleanTypeConverters: TypeConverters<number, boolean> = {
  save: value => {
    return (value === true ? 1 : value === false ? 0 : null)
  },
  restore: value => {
    return (value === 1 ? true : value === 0 ? false : null)
  }
}

/**
 * 内置的 Date 类型转换器
 */
export const DateTypeConverters: TypeConverters<string, Date> = {
  save: value => {
    return value?.toString() || null
  },
  restore: value => {
    return value ? new Date(value) : null
  }
}

/**
 * 内置的 TimeStamp 类型转换器
 */
export const TimestampTypeConverters: TypeConverters<number, Date> = {
  save: value => {
    return value?.getTime() || null
  },
  restore: value => {
    return value ? new Date(value) : null
  }
}