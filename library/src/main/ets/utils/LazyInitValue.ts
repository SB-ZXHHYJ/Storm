export class LazyInitValue<T> {
  private _initialized: boolean
  private _value: T;
  private initializedScope: () => T

  constructor(initializedScope: () => T) {
    this.initializedScope = initializedScope
  }

  get value(): T {
    if (!this._initialized) {
      this._value = this.initializedScope();
      this._initialized = true;
    }
    return this._value;
  }
}