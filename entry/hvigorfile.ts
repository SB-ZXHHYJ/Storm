import { hapTasks } from '@ohos/hvigor-ohos-plugin';
import { stormTypeSafePlugin } from '@zxhhyj/storm-typesafe-plugin'

export default {
  system: hapTasks,
  plugins: [stormTypeSafePlugin()]
}
