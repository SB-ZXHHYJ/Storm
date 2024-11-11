import { Column } from '../schema/Column';
import { ValueType } from '@kit.ArkData';

/**
 * 将被修饰的实体属性与指定的Column进行双向绑定
 * @param column 指定的Column实例
 */
export function SqlColumn<V>(column: Column<ValueType, V>): PropertyDecorator {
  return (_target: object, primaryKey: string) => {
    column.bindTo(undefined, primaryKey)
  }
}