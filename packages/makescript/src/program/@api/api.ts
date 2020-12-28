import Hapi from '@hapi/hapi';
import {logger} from '@makeflow/makescript-agent';

import {Entrances} from '../@entrances';

import {serveExternalAPI} from './@external';
import {serveWeb} from './@web';

export async function serveAPI(
  server: Hapi.Server,
  entrances: Entrances,
): Promise<void> {
  await serveExternalAPI(server, entrances);
  await serveWeb(server, entrances);

  logger.info(`MakeScript is running on port ${entrances.config.listen.port}`);
}
