import { relationalStore } from '@kit.ArkData';
import { Context } from '@ohos.arkui.UIContext';

export abstract class Database {
  /**
   * 实现这个函数，并在最后返回这个数据库的 RdbStore 对象
   * 这个函数将在被初始化时调用
   * @param context 上下文
   * @returns RdbStore 对象
   */
  abstract initDb(context: Context): Promise<relationalStore.RdbStore>
}