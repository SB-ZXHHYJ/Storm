import { TableAction } from './TableAction';

export interface OnTableChangedListener<T> {
  (t: T, action: TableAction): void
}