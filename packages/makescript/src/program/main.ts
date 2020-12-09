import 'villa/platform/node';

import Hapi from '@hapi/hapi';

import {serveAPI} from './@api';
import {Entrances} from './@entrances';
import {Config} from './config';

export async function main(config: Config): Promise<void> {
  let webServer = Hapi.server({
    host: config.webAdmin.host,
    port: config.webAdmin.port,
  });

  let externalAPIServer = Hapi.server({
    host: config.api.host,
    port: config.api.port,
  });

  let entrances = new Entrances(externalAPIServer.listener, config);

  await entrances.ready;

  await serveAPI(webServer, externalAPIServer, entrances);
}
