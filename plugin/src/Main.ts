import { HvigorNode, HvigorPlugin } from '@ohos/hvigor';

export function stormTypeSafePlugin(): HvigorPlugin {
    return {
        pluginId: 'stormTypeSafePlugin',
        apply(node: HvigorNode) {
            console.log(`node: ${node.getNodeName()}, path: ${node.getNodePath()}`);
            console.log('hello stormTypeSafePlugin!');
            node.registerTask({
                name: 'TypeSafe',
                run() {
                    console.log('this is Task');
                }
            });
        }
    }
}