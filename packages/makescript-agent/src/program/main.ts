import 'villa/platform/node';

import {Tiva} from 'tiva';

import {
  NodeAdapter,
  ProcessAdapter,
  ShellAdapter,
  SqliteAdapter,
} from './@adapters';
import {Entrances} from './@entrances';
import {Config} from './config';
import {logger} from './shared';

export async function main(tiva: Tiva, config: Config): Promise<void> {
  let entrances = new Entrances(tiva, config);

  let adapters = [
    new ProcessAdapter(),
    new NodeAdapter(),
    new ShellAdapter(),
    new SqliteAdapter(),
  ];

  for (let adapter of adapters) {
    // TODO: any
    entrances.runningService.registerAdapter(adapter.type, adapter as any);
  }

  logger.info('MakeScript agent started.');
}
