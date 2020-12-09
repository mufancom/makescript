import 'villa/platform/node';

import {
  ExecutableAdapter,
  NodeAdapter,
  ShellAdapter,
  SqliteAdapter,
} from './@adapters';
import {Entrances} from './@entrances';
import {Config} from './config';

export async function main(config: Config): Promise<void> {
  let entrances = new Entrances(config);

  let adapters = [
    new ExecutableAdapter(),
    new NodeAdapter(),
    new ShellAdapter(),
    new SqliteAdapter(),
  ];

  for (let adapter of adapters) {
    entrances.runningService.registerAdapter(adapter.type, adapter);
  }

  await entrances.makescriptService.initialize();
}
