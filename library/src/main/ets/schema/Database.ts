import { relationalStore } from '@kit.ArkData';
import { Context } from '@ohos.arkui.UIContext';

export abstract class Database {
  abstract initDb(context: Context): Promise<relationalStore.RdbStore>
}