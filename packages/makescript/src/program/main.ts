import 'villa/platform/node';

import {serveAPI} from './@api';
import {Entrances} from './@entrances';
import {Config} from './config';

export async function main(config: Config): Promise<void> {
  let entrances = new Entrances(config);

  await entrances.ready;

  await serveAPI(entrances);
}
