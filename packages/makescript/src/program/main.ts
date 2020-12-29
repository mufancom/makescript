import 'villa/platform/node';

import Hapi from '@hapi/hapi';

import {serveAPI} from './@api';
import {Entrances} from './@entrances';
import {Config} from './config';

export async function main(config: Config): Promise<void> {
  let server = Hapi.server({
    host: config.listen.host,
    port: config.listen.port,
    state: {
      strictHeader: false,
    },
  });

  let entrances = new Entrances(server.listener, config);

  await entrances.ready;

  await serveAPI(server, entrances);
}
