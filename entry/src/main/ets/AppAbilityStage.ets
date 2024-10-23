import { AbilityStage, Want } from '@kit.AbilityKit';
import { database, Database } from '@zxhhyj/storm';
import { relationalStore } from '@kit.ArkData';

export default class AppAbilityStage extends AbilityStage {
  async onCreate() {
    database.globalDatabase = await Database.create(this.context, {
      name: "app.db",
      securityLevel: relationalStore.SecurityLevel.S1
    })
  }

  onAcceptWant(_want: Want): string {
    return 'AppAbilityStage';
  }
}