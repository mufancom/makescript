import 'villa/platform/node';

import {Tiva} from 'tiva';

import {
  ExecutableAdapter,
  NodeAdapter,
  ShellAdapter,
  SqliteAdapter,
} from './@adapters';
import {Entrances} from './@entrances';
import {Config} from './config';
import {logger} from './shared';

export async function main(tiva: Tiva, config: Config): Promise<void> {
  let entrances = new Entrances(tiva, config);

  let adapters = [
    new ExecutableAdapter(),
    new NodeAdapter(),
    new ShellAdapter(),
    new SqliteAdapter(),
  ];

  for (let adapter of adapters) {
    entrances.runningService.registerAdapter(adapter.type, adapter);
  }

  logger.info('Makescript agent started.');
}
