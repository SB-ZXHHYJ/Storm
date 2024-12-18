import { AbilityStage, Want } from '@kit.AbilityKit';
import { myDatabase } from './logic/database/AppDatabase';

export default class AppAbilityStage extends AbilityStage {
  async onCreate() {
    await myDatabase.init(this.context)
  }

  onAcceptWant(_want: Want): string {
    return 'AppAbilityStage';
  }
}