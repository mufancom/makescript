import Hapi from '@hapi/hapi';

import {Entrances} from '../@entrances';

import {serveExternalAPI} from './@external';
import {serveWeb} from './@web';

export async function serveAPI(
  webServer: Hapi.Server,
  externalAPIServer: Hapi.Server,
  entrances: Entrances,
): Promise<void> {
  await serveExternalAPI(externalAPIServer, entrances);
  await serveWeb(webServer, entrances);
}
