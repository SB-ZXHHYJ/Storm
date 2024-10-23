/**
 * @access https://github.com/AmonHu/armon-modules/tree/master/string-builder
 */
export class StringBuilder {
  private _store: Array<string>;

  constructor();

  constructor(value: string);

  constructor(value: number);

  constructor(value: boolean);

  constructor(value: string[]);

  constructor(value: StringBuilder);

  constructor(value?: string | number | boolean | string[] | StringBuilder) {
    if (typeof value === 'string') {
      this._store = [value];
    } else if (value instanceof Array) {
      this._store = value;
    } else if (value instanceof StringBuilder) {
      this._store = value._store;
    } else if (value) {
      this._store = [value.toString()];
    } else {
      this._store = [];
    }
  }

  get length() {
    return this._store.length;
  }

  append(value: string): void;

  append(value: number): void;

  append(value: boolean): void;

  append(value: string[]): void;

  append(value: StringBuilder): void;

  append(value: string | number | boolean | string[] | StringBuilder): void {
    if (typeof value === 'string') {
      this._store.push(value);
    } else if (value instanceof Array) {
      this._store.push(...value);
    } else if (value instanceof StringBuilder) {
      this._store.push(...value._store);
    } else {
      this._store.push(value.toString());
    }
  }

  insert(index: number, value: string): void;

  insert(index: number, value: number): void;

  insert(index: number, value: boolean): void;

  insert(index: number, value: string[]): void;

  insert(index: number, value: StringBuilder): void;

  insert(index: number, value: string | number | boolean | string[] | StringBuilder): void {
    if (typeof value === 'string') {
      this._store.splice(index, 0, value);
    } else if (value instanceof Array) {
      this._store.splice(index, 0, ...value);
    } else if (value instanceof StringBuilder) {
      this._store.splice(index, 0, ...value._store);
    } else {
      this._store.splice(index, 0, value.toString());
    }
  }

  clear() {
    this._store = [];
  }

  remove(start: number, length: number) {
    this._store.splice(start, length);
  }

  replace(substr: string, replacement: string) {
    this._store = this._store.map(s => s === substr ? replacement : s);
  }

  toString() {
    return this._store.join('');
  }

  equals(value: StringBuilder) {
    return this.toString() === value.toString();
  }
}