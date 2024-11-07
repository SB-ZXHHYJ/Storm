export class AnyUtils {
  private constructor() {
  }

  public static modelToString(obj): string {
    return Object.entries(obj)
      .map(([key, value]) => `Key: ${key}, Value: ${value}`)
      .join('\n'); // 使用换行符连接所有的键值对字符串
  }
}