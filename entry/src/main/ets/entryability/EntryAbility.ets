import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage): void {
    /*relationalStore.getRdbStore(this.context, {
      name: 'RdbTest.db', // 数据库文件名
      securityLevel: relationalStore.SecurityLevel.S1
    }, (_err, store) => {
      store.executeSql('CREATE TABLE IF NOT EXISTS t_bookcase (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)');
      store.executeSql('ALTER TABLE t_bookcase ADD COLUMN create_data_time TEXT');
      store.executeSql('ALTER TABLE t_bookcase DROP COLUMN name TEXT')
      //executeSync会闪退
    })*/
    windowStage.loadContent('pages/Index');
  }
}
