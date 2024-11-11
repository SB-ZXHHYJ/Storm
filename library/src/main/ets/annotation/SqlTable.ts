import { Table } from '../schema/Table';

/**
 * 将实体绑定到指定的Table上
 * @param _value 指定的Table实例
 * @deprecated 这个注解将不再产生任何作用了，可以只保留实体属性中的@SqlColumn()注解，预计在2025年前移除
 */
export function SqlTable<M>(_value: Table<M>): ClassDecorator {
  return (_target) => {
  }
}