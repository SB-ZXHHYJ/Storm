import { relationalStore } from '@kit.ArkData';
import { Context } from '@ohos.arkui.UIContext';

export abstract class Database {
  /**
   * 实现该函数并返回数据库的 RdbStore 对象
   * 该函数将在初始化时调用
   *
   * @param context 应用上下文
   * @returns RdbStore 实例
   */
  abstract initDb(context: Context): Promise<relationalStore.RdbStore>
}